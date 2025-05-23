// tricks.js - ES6 Module Version

// --- Constants (Module-scoped) ---
const deck_tricks = [
    { value: "7", suit: "♥" }, { value: "8", suit: "♥" }, { value: "9", suit: "♥" }, { value: "10", suit: "♥" }, { value: "J", suit: "♥" }, { value: "Q", suit: "♥" }, { value: "K", suit: "♥" }, { value: "A", suit: "♥" },
    { value: "7", suit: "♦" }, { value: "8", suit: "♦" }, { value: "9", suit: "♦" }, { value: "10", suit: "♦" }, { value: "J", suit: "♦" }, { value: "Q", suit: "♦" }, { value: "K", suit: "♦" }, { value: "A", suit: "♦" },
    { value: "7", suit: "♣" }, { value: "8", suit: "♣" }, { value: "9", suit: "♣" }, { value: "10", suit: "♣" }, { value: "J", suit: "♣" }, { value: "Q", suit: "♣" }, { value: "K", suit: "♣" }, { value: "A", suit: "♣" },
    { value: "7", suit: "♠" }, { value: "8", suit: "♠" }, { value: "9", suit: "♠" }, { value: "10", suit: "♠" }, { value: "J", suit: "♠" }, { value: "Q", suit: "♠" }, { value: "K", suit: "♠" }, { value: "A", suit: "♠" },
  ];
  const cardStyle_tricks = { "♥": "hearts", "♦": "diamonds", "♣": "clubs", "♠": "spades" };
  const cardRanks_tricks = { 7: 1, 8: 2, 9: 3, 10: 4, J: 5, Q: 6, K: 7, A: 8 };
  const players_tricks = ["player1", "player2", "player3", "player4"];
  
  // --- Module State ---
  let playerHands = {}; // Reference to controller state
  let inPlay = [];      // Reference to controller state
  let uiElements = {};  // Reference to controller UI elements
  let controllerUpdateState = () => {};
  let controllerUpdateScores = () => {}; // Kept for now, but likely unused if score updates via updateGameState
  let controllerShowNotification = () => {};
  let controllerDelay = () => {};
  let controllerActiveGameRef = {}; // Reference to controller's activeGame object
  
  let roundScore_tricks = [0, 0, 0, 0];
  let currentStarter_tricks = null; // Will be set from controller
  let roundOver_tricks = false;
  let isFirstTrick_tricks = true;
  let humanPlayerTurn_tricks = false;
  let humanCardSelectionResolver_tricks = null;
  let tricksRoundStarted = false;
  let trickInProgress = false;
  
  // --- Initialization Function ---
  function initTricksRound() {
      console.log("Tricks.js: initTricksRound called.");
      if (tricksRoundStarted) {
          console.log("Tricks.js: Round already started.");
          return;
      }
      tricksRoundStarted = true;
      roundOver_tricks = false;
      trickInProgress = false;
      isFirstTrick_tricks = true;
      humanPlayerTurn_tricks = false;
      humanCardSelectionResolver_tricks = null;
      roundScore_tricks = [0, 0, 0, 0];
      
      // Get the starting player from the controller
      currentStarter_tricks = controllerActiveGameRef.currentStarter;
      console.log(`Tricks.js: Using starting player from controller: ${currentStarter_tricks}`);
      
      // Confirm the starter with the controller
      controllerActiveGameRef.updateStarter(currentStarter_tricks);
  
      // Deal cards
      let shuffledDeck = [...deck_tricks];
      for (let i = shuffledDeck.length - 1; i >= 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
      }
      // Clear hands before dealing
      for (let player of players_tricks) {
           if (!playerHands[player]) playerHands[player] = [];
           playerHands[player] = [];
      }
      let cardIndex = 0;
      while (cardIndex < shuffledDeck.length) {
          for (let player of players_tricks) {
               if (!playerHands[player]) playerHands[player] = [];
              if (cardIndex < shuffledDeck.length && playerHands[player].length < 8) {
                  playerHands[player].push(shuffledDeck[cardIndex]);
                  cardIndex++;
              }
          }
      }
  
      renderHands_tricks();
      clearBoard_tricks();
      controllerShowNotification(`Tricks Round Started! ${formatPlayerName(currentStarter_tricks)} starts.`);
  
      // --- CHANGE: Auto-start logic ---
      // Update controller state: round started AND first trick is starting NOW
      console.log("Tricks.js: Round initialized, starting first trick automatically.");
      controllerUpdateState({ gameStarted: true, roundOver: false, trickInProgress: true }); // <<< Set trickInProgress TRUE here
  
      // Start the first trick automatically
      startTrick_tricks(currentStarter_tricks); // <<< UNCOMMENTED this line
  }
  
  // Helper function to format player names
  function formatPlayerName(playerId) {
      if (playerId === 'player1') return 'Human';
      return `Player ${playerId.replace('player', '')}`;
  }
  
  // --- Game Logic Functions (using shared state/UI refs) ---
  async function startTrick_tricks(startingPlayer) {
      console.log(`Tricks.js: Starting trick, leader: ${startingPlayer}`);
      // Check only if round is over, controller handles trickInProgress check before calling
      if (roundOver_tricks) {
          console.warn(`Tricks.js: startTrick called but round is already over.`);
          controllerUpdateState({ trickInProgress: false, roundOver: true }); // Ensure controller knows
          return;
      }
  
      trickInProgress = true; // Mark trick as started
      inPlay = []; // <<< CRUCIAL: Ensure inPlay is cleared HERE at the start of the trick
      players_tricks.forEach((player) => {
          if (uiElements.playAreas && uiElements.playAreas[player]) {
              uiElements.playAreas[player].innerHTML = "";
          } else { console.error(`Tricks.js UI element playAreas[${player}] missing!`); }
      });
      humanPlayerTurn_tricks = false;
      let turnOrder = getNextPlayers_tricks(startingPlayer);
      console.log(`Tricks.js: Turn order: ${turnOrder.join(', ')}`);
  
      try {
          // --- Player Turn Loop ---
          for (let i = 0; i < turnOrder.length; i++) {
              let player = turnOrder[i];
               console.log(`Tricks.js: Current turn: ${player}`);
               if (roundOver_tricks) {
                   console.log(`Tricks.js: Round ended mid-trick.`);
                   break;
               }
              let leadSuit = inPlay.length > 0 ? inPlay[0].suit : null;
              let playedCard = null;
  
               if (player === "player1") {
                   humanPlayerTurn_tricks = true;
                   console.log("Tricks.js: >>> Entering await waitForPlayer1_tricks"); // LOG BEFORE AWAIT
                   playedCard = await waitForPlayer1_tricks(leadSuit); 
                   console.log("Tricks.js: <<< Exited await waitForPlayer1_tricks"); // LOG AFTER AWAIT
                   humanPlayerTurn_tricks = false;
                   if (!playedCard) throw new Error("Human player action failed.");
               } else {
                   console.log(`Tricks.js: >>> Entering await controllerDelay for ${player}`); // LOG BEFORE AWAIT
                   await controllerDelay(600); 
                   console.log(`Tricks.js: <<< Exited await controllerDelay for ${player}`); // LOG AFTER AWAIT
                   playedCard = selectCard_Tricks_AI(player, leadSuit, startingPlayer, isFirstTrick_tricks);
                   if (!playedCard) throw new Error(`AI player ${player} failed to select card.`);
               }
  
               // Assign player AFTER getting card, before adding to inPlay/board
               if (playedCard && typeof playedCard === 'object') {
                   playedCard.player = player;
                   inPlay.push(playedCard); // <<< Card pushed HERE (only 4 times total)
                   playCardToBoard_tricks(playedCard, player);
               } else {
                   throw new Error(`Invalid card from player ${player}.`);
               }
          }
          // --- End Player Turn Loop ---
  
          // --- Trick Resolution (only if loop completed naturally) ---
          console.log("Tricks.js: Trick loop finished. Processing outcome...");
          // Check length MUST be 4 if loop completed without break/error
          if (inPlay.length === 4 && !roundOver_tricks) {
              console.log("Tricks.js: Processing trick score..."); // Add log
              let trickWinner = determineTrickWinner_tricks(inPlay);
              let points = 1; // 1 point per trick in this round
              if (trickWinner) {
                   let winnerIndex = players_tricks.indexOf(trickWinner);
                   if (winnerIndex !== -1) {
                      roundScore_tricks[winnerIndex] += points;
                      console.log(`Tricks.js Updated Round Score: ${roundScore_tricks.join(',')}`); // Log updated score
                   } else { console.error(`Tricks.js: Winner ${trickWinner} not found.`); }
              } else { console.log("Tricks.js: No trick winner determined."); }
  
              currentStarter_tricks = trickWinner || startingPlayer;
              controllerActiveGameRef.updateStarter(currentStarter_tricks);
              roundOver_tricks = checkRoundOver_tricks(playerHands);
              // roundOver status sent in finally block
  
              if (roundOver_tricks) {
                  console.log("Tricks.js: Round Over condition met after trick.");
                  controllerShowNotification(`Tricks Round Over! Click Next Round.`);
              }
          } else if (roundOver_tricks) {
              // This case happens if checkRoundOver became true mid-loop (shouldn't for tricks?)
              console.log("Tricks.js: Trick processing skipped as round ended mid-trick.");
          } else if (inPlay.length !== 4) {
               // This case happens if the loop broke or errored before 4 cards
               console.warn(`Tricks.js: Trick ended with unexpected length ${inPlay.length}. Not processing score.`);
          }
          // --- End Trick Resolution ---
  
      } catch (error) {
           console.error("Tricks.js: Error during trick execution:", error);
           roundOver_tricks = true; // Mark round over on error to prevent getting stuck
      } finally {
          // --- Signal Trick Completion ---
          isFirstTrick_tricks = false; // First trick attempt is definitely done
          trickInProgress = false; // Mark trick as finished
  
          // Update controller with final state for this trick attempt
          console.log(`Tricks.js: Trick attempt finished. Updating controller state (trickInProgress=false, roundOver=${roundOver_tricks}, currentRoundScore=${roundScore_tricks.join(',')})`);
          controllerUpdateState({
              trickInProgress: false,
              roundOver: roundOver_tricks,
              currentRoundScore: [...roundScore_tricks] // Send score copy
          });
          // --- End Signal Trick Completion ---
      }
  }
  
  function checkRoundOver_tricks(currentHands) {
       // Check if ALL player hands in the shared state are empty
       const isEmpty = players_tricks.every((player) => !currentHands[player] || currentHands[player].length === 0);
       if(isEmpty) console.log("Tricks.js: checkRoundOver - Hands empty. Round OVER.");
      return isEmpty;
  }
  
  function clearBoard_tricks() {
      players_tricks.forEach((player) => {
          if (uiElements.playAreas && uiElements.playAreas[player]) {
               uiElements.playAreas[player].innerHTML = "";
          } else { console.error(`Tricks.js UI element playAreas[${player}] missing!`); }
       });
  }
  
  function renderHands_tricks() {
      players_tricks.forEach((player) => {
          if (!uiElements.handsEls || !uiElements.handsEls[player]) {
               console.error(`Tricks.js UI element handsEls[${player}] not found!`);
               return;
           }
          uiElements.handsEls[player].innerHTML = "";
          // Ensure playerHands[player] is valid before proceeding
          if (playerHands[player] && Array.isArray(playerHands[player])) {
              if (player === 'player1') {
                  playerHands[player].sort((a, b) => {
                      if (a.suit < b.suit) return -1; if (a.suit > b.suit) return 1;
                      return cardRanks_tricks[a.value] - cardRanks_tricks[b.value];
                  });
              }
              playerHands[player].forEach((card) => {
                  let cardHTML = player === "player1"
                      ? `<div class="card ${cardStyle_tricks[card.suit]}" data-value="${card.value}" data-suit="${card.suit}"><span>${card.value}</span>${card.suit}</div>`
                      : `<img class="card back" src="static assets/playing card back.png" alt="Face Down Card" />`;
                  uiElements.handsEls[player].insertAdjacentHTML("beforeend", cardHTML);
              });
          } else { console.warn(`Tricks.js: Player hand for ${player} invalid during render.`); }
      });
      // Listeners attached by waitForPlayer1
  }
  
  function playCardToBoard_tricks(card, player) {
      if (!card || !card.player) {
          console.error("playCardToBoard_tricks: Invalid card/player:", player, card);
          return;
      }
      if (!playerHands[player]) { console.error(`Tricks.js: Hand for ${player} missing.`); return; }
  
      const initialLength = playerHands[player].length;
      playerHands[player] = playerHands[player].filter(c => !(c.value === card.value && c.suit === card.suit));
      if(initialLength === playerHands[player].length) console.warn(`Tricks.js: Card ${card.value}${card.suit} not found in ${player} hand.`);
  
      // Update visuals
      if (player !== 'player1') {
          if (uiElements.handsEls && uiElements.handsEls[player] && uiElements.handsEls[player].firstChild) {
              uiElements.handsEls[player].removeChild(uiElements.handsEls[player].firstChild);
          }
      } else {
          renderHands_tricks(); // Re-render human hand
      }
      if(uiElements.playAreas && uiElements.playAreas[player]){
           uiElements.playAreas[player].innerHTML = `<div class="card ${cardStyle_tricks[card.suit]}">${card.value} ${card.suit}</div>`;
       } else { console.error(`Tricks.js UI element playAreas[${player}] missing!`); }
  }
  
  function selectCard_Tricks_AI(player, leadSuit, starter, isFirstTrick) {
    const playerCards = playerHands[player];
    if (!playerCards || playerCards.length === 0) return null;
    
    // Helper function to identify singleton cards (only one card of that suit)
    const getSingletons = () => {
        const suitCounts = {};
        playerCards.forEach(card => {
            suitCounts[card.suit] = (suitCounts[card.suit] || 0) + 1;
        });
        return playerCards.filter(card => suitCounts[card.suit] === 1);
    };

    // Check if this player is the 4th player in the trick
    const isFourthPlayer = inPlay.length === 3;
    
    // Must follow suit if possible
    if (leadSuit) {
        const cardsOfLeadSuit = playerCards.filter(card => card.suit === leadSuit);
        
        // 1. If player has cards of the lead suit
        if (cardsOfLeadSuit.length > 0) {
            // Find highest card played so far of the lead suit
            const highestPlayedCard = inPlay
                .filter(card => card.suit === leadSuit)
                .reduce((highest, card) => 
                    cardRanks_tricks[card.value] > cardRanks_tricks[highest.value] ? card : highest, 
                    {value: '7', suit: leadSuit}); // Default to lowest
                    
            // 3. If player has cards lower than highest played, play highest safe card
            const safeCards = cardsOfLeadSuit.filter(card => 
                cardRanks_tricks[card.value] < cardRanks_tricks[highestPlayedCard.value]);
                
            if (safeCards.length > 0) {
                // Play highest card that won't win
                return safeCards.reduce((highest, card) => 
                    cardRanks_tricks[card.value] > cardRanks_tricks[highest.value] ? card : highest);
            }
            
            // No safe cards - player can't avoid winning
            // If playing 4th or all cards would win, play highest card of lead suit
            return cardsOfLeadSuit.reduce((highest, card) => 
                cardRanks_tricks[card.value] > cardRanks_tricks[highest.value] ? card : highest);
        }
        
        // 2. If player doesn't have cards of the lead suit
        // Check for singleton 9 or higher
        const singletons = getSingletons();
        const highSingletons = singletons.filter(card => cardRanks_tricks[card.value] >= 3); // 9 or higher
        
        if (highSingletons.length > 0) {
            // Play highest singleton
            return highSingletons.reduce((highest, card) => 
                cardRanks_tricks[card.value] > cardRanks_tricks[highest.value] ? card : highest);
        }
        
        // No high singleton, play highest card overall
        return playerCards.reduce((highest, card) => 
            cardRanks_tricks[card.value] > cardRanks_tricks[highest.value] ? card : highest);
    }
    
    // 4. Leading the trick (no lead suit)
    // Check for singleton 10 or lower
    const singletons = getSingletons();
    const lowSingletons = singletons.filter(card => cardRanks_tricks[card.value] <= 4); // 10 or lower
    
    if (lowSingletons.length > 0) {
        // Lead with lowest singleton 10 or lower
        return lowSingletons.reduce((lowest, card) => 
            cardRanks_tricks[card.value] < cardRanks_tricks[lowest.value] ? card : lowest);
    }
    
    // No low singleton, lead with lowest card
    return playerCards.reduce((lowest, card) => 
        cardRanks_tricks[card.value] < cardRanks_tricks[lowest.value] ? card : lowest);
  }
  
  function determineTrickWinner_tricks(trickCards) {
       if (!trickCards || trickCards.length !== 4) {
           console.error("determineTrickWinner_tricks: Invalid trickCards length");
           return null;
       }
      const leadingSuit = trickCards[0].suit;
      const cardsOfLeadSuit = trickCards.filter(card => card.suit === leadingSuit);
      let winningCard = null;
      if (cardsOfLeadSuit.length > 0) {
          winningCard = cardsOfLeadSuit.reduce((highest, card) => cardRanks_tricks[card.value] > cardRanks_tricks[highest.value] ? card : highest);
      } else {
          winningCard = trickCards[0]; // First card wins if no one followed suit
          console.warn(`Tricks.js: No cards of lead suit ${leadingSuit}. First card wins.`);
      }
      if (!winningCard || !winningCard.player) {
          console.error("Tricks.js: Winning card/player invalid!", winningCard);
          // Fallback: try to find original card with player prop
          const originalCard = trickCards.find(c => c.value === winningCard.value && c.suit === winningCard.suit && c.player);
          return originalCard ? originalCard.player : null;
      }
      return winningCard.player;
  }
  
  // --- Get Next Player ---
  function getNextPlayers_tricks(startingPlayer) {
      let order = [...players_tricks];
      let startIndex = order.indexOf(startingPlayer);
      if (startIndex === -1) {
          console.warn(`Tricks.js: Starting player ${startingPlayer} not found, defaulting.`);
          startIndex = 0;
      }
      return [...order.slice(startIndex), ...order.slice(0, startIndex)];
  }
  
  // --- Human Interaction ---
   function attachHumanCardListeners_tricks() {
      if (!uiElements.handsEls || !uiElements.handsEls.player1) return;
      const cardElements = uiElements.handsEls.player1.querySelectorAll(".card");
      cardElements.forEach((cardEl) => {
          cardEl.removeEventListener("click", handleHumanClick_tricks); // Clean up
          cardEl.addEventListener("click", handleHumanClick_tricks);
      });
  }
  
  function removeHumanCardListeners_tricks() {
       if (!uiElements.handsEls || !uiElements.handsEls.player1) return;
       const cardElements = uiElements.handsEls.player1.querySelectorAll(".card");
       cardElements.forEach((cardEl) => {
          cardEl.removeEventListener("click", handleHumanClick_tricks);
      });
  }
  
  function handleHumanClick_tricks(event) {
      if (!humanPlayerTurn_tricks || !humanCardSelectionResolver_tricks) return;
      const clickedCardEl = event.target.closest(".card");
      if (!clickedCardEl) return;
      const leadSuit = inPlay.length > 0 ? inPlay[0].suit : null;
      const cardValue = clickedCardEl.dataset.value;
      const cardSuit = clickedCardEl.dataset.suit;
      const playedCard = playerHands.player1.find(card => card.value === cardValue && card.suit === cardSuit);
      if (!playedCard) {
          console.error("Tricks.js: Clicked card not found in hand!");
          return;
      }
      const hasLeadSuitOnHand = playerHands.player1.some(card => card.suit === leadSuit);
      if (leadSuit && hasLeadSuitOnHand && playedCard.suit !== leadSuit) {
          controllerShowNotification(`You must play a ${leadSuit} card!`);
          return; // Wait for valid input
      }
  
      // Valid play
      humanPlayerTurn_tricks = false;
      removeHumanCardListeners_tricks(); // Prevent multiple clicks
       if (uiElements.handsEls && uiElements.handsEls.player1) {
          uiElements.handsEls.player1.classList.remove('active-turn');
      }
      humanCardSelectionResolver_tricks(playedCard);
      humanCardSelectionResolver_tricks = null;
  }
  
  function waitForPlayer1_tricks(leadSuit) {
      console.log(`Tricks.js: Waiting for P1 (lead: ${leadSuit || 'None'})`);
      return new Promise((resolve, reject) => {
        // Clear previous resolver if any
        if (humanCardSelectionResolver_tricks) {
            console.warn("Tricks.js: waitForPlayer1 resolver already active! Clearing.");
        }
        humanCardSelectionResolver_tricks = resolve;
        attachHumanCardListeners_tricks();
        if (uiElements.handsEls && uiElements.handsEls.player1) {
          uiElements.handsEls.player1.classList.add('active-turn');
        }
        // Add timeout?
        // setTimeout(() => reject(new Error("Player 1 timed out")), 30000);
      }).finally(() => {
           console.log("Tricks.js: Player 1 promise finished.");
           // Ensure resolver is cleared
           if (humanCardSelectionResolver_tricks) humanCardSelectionResolver_tricks = null;
           // Clean up UI
           if (uiElements.handsEls && uiElements.handsEls.player1) {
              uiElements.handsEls.player1.classList.remove('active-turn');
           }
           removeHumanCardListeners_tricks(); // Ensure listeners removed
      });
  }
  
  
  // --- Registration Function (Exported) ---
  export function register(controllerGameObj, sharedState) {
      console.log("Tricks.js: Registering with controller.");
      playerHands = sharedState.playerHands;
      inPlay = sharedState.inPlay;
      uiElements = sharedState.uiElements;
      controllerUpdateState = sharedState.updateGameState;
      controllerUpdateScores = sharedState.updateTotalScores; // Keep for now?
      controllerShowNotification = sharedState.showNotification;
      controllerDelay = sharedState.delay;
      controllerActiveGameRef = controllerGameObj;
  
      // Populate the controller's activeGame object
      controllerGameObj.name = 'tricks';
      controllerGameObj.init = initTricksRound;
      controllerGameObj.startTrick = startTrick_tricks;
      
      // Get the starting player from controller
      currentStarter_tricks = controllerGameObj.currentStarter;
      console.log(`Tricks.js: Starting player from controller registration: ${currentStarter_tricks}`);
  
      console.log("Tricks.js module registered.");
      // Reset internal state on registration
      tricksRoundStarted = false;
  }
  
  console.log("Tricks.js module loaded.");
  