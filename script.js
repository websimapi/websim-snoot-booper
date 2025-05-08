document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const snootImage = document.getElementById('snoot-image');
    const boopButton = document.getElementById('boop-button');
    const boopEffect = document.getElementById('boop-effect');
    const snootInput = document.getElementById('snoot-input');
    const generateButton = document.getElementById('generate-button');
    const randomButton = document.getElementById('random-button');
    const boopCountDisplay = document.getElementById('boop-count');
    const snootCountDisplay = document.getElementById('snoot-count');
    const snootHistory = document.getElementById('snoot-history');
    const loadingIndicator = document.getElementById('loading');

    // Game state
    let boopCount = 0;
    let snootCount = 0;
    let currentSnootPrompt = '';
    let discoveredSnoots = [];
    let boopSound;
    let audioEnabled = true;
    
    // Initialize custom cursor
    initializeCursor();
    
    // Initialize sound
    initializeAudio();
    
    // Load saved data from localStorage
    loadGameState();
    
    // Set up event listeners
    boopButton.addEventListener('click', boopTheSnoot);
    snootImage.addEventListener('click', boopTheSnoot);
    generateButton.addEventListener('click', generateCustomSnoot);
    randomButton.addEventListener('click', generateRandomSnoot);
    
    // Function to initialize custom cursor
    function initializeCursor() {
        // Pre-load cursor image to ensure it's available
        const cursorImage = new Image();
        cursorImage.src = 'cursor_hand.png';
        
        // Add cursor class to interactive elements when image is loaded
        cursorImage.onload = () => {
            const interactiveElements = document.querySelectorAll('#snoot-image, #boop-button, .snoot-item, #generate-button, #random-button, input[type="text"]');
            interactiveElements.forEach(element => {
                element.classList.add('cursor-enabled');
            });
        };
        
        // Fallback if cursor image fails to load
        cursorImage.onerror = (error) => {
            console.error('Custom cursor image failed to load:', error);
        };
    }
    
    // Function to initialize audio
    function initializeAudio() {
        try {
            boopSound = new Audio('boop_sound.mp3');
            boopSound.volume = 0.5;
            
            // Check if audio can be played
            boopSound.addEventListener('canplaythrough', () => {
                audioEnabled = true;
            });
            
            // Handle audio loading error
            boopSound.addEventListener('error', (e) => {
                console.error('Audio loading error:', e);
                audioEnabled = false;
            });
            
            // Preload the audio
            boopSound.load();
        } catch (error) {
            console.error('Audio initialization error:', error);
            audioEnabled = false;
        }
    }
    
    // Function to boop the snoot
    function boopTheSnoot() {
        // Play boop sound if audio is enabled
        if (audioEnabled && boopSound) {
            try {
                boopSound.currentTime = 0;
                const playPromise = boopSound.play();
                
                // Handle play promise rejection
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.error('Audio playback error:', error);
                        audioEnabled = false;
                    });
                }
            } catch (error) {
                console.error('Error playing sound:', error);
                audioEnabled = false;
            }
        }
        
        // Show boop effect
        boopEffect.classList.add('active');
        setTimeout(() => {
            boopEffect.classList.remove('active');
        }, 700);
        
        // Add jiggle animation to the snoot
        snootImage.style.animation = 'none';
        void snootImage.offsetWidth; // Trigger reflow
        snootImage.style.animation = 'jiggle 0.5s';
        
        // Update boop count
        boopCount++;
        boopCountDisplay.textContent = boopCount;
        
        // Save game state
        saveGameState();
    }
    
    // Function to generate a custom snoot based on user input
    async function generateCustomSnoot() {
        const userInput = snootInput.value.trim();
        if (!userInput) {
            alert('Please describe the snoot you want to generate!');
            return;
        }
        
        await generateSnoot(userInput);
    }
    
    // Function to generate a random snoot idea
    async function generateRandomSnoot() {
        setLoading(true);
        
        try {
            // Get a random snoot idea using AI
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are a creative snoot generator for a cute game. Generate a single, cute, family-friendly animal or creature snoot concept. 
                        Respond directly with JSON, following this JSON schema, and no other text.
                        {
                          concept: string;
                          description: string;
                        }`
                    },
                    {
                        role: "user",
                        content: "Generate a random cute snoot idea for my Snoot Booper game."
                    }
                ],
                json: true
            });
            
            const result = JSON.parse(completion.content);
            const randomPrompt = result.concept;
            
            // Show the user what we're generating
            snootInput.value = randomPrompt;
            
            // Generate the snoot image
            await generateSnoot(randomPrompt);
        } catch (error) {
            console.error('Error generating random snoot:', error);
            alert('Oops! Something went wrong generating a random snoot. Please try again!');
            setLoading(false);
        }
    }
    
    // Function to generate a snoot image based on a prompt
    async function generateSnoot(prompt) {
        setLoading(true);
        
        try {
            // Generate detailed prompt for better image quality
            const detailedPrompt = `close-up of a cute ${prompt}'s nose and face, adorable, hand-drawn style, soft colors, family-friendly, cartoonish`;
            
            // Generate image using AI
            const result = await websim.imageGen({
                prompt: detailedPrompt,
                aspect_ratio: "1:1",
            });
            
            // Update the image and current prompt
            snootImage.src = result.url;
            currentSnootPrompt = prompt;
            
            // Add to discovered snoots if it's new
            if (!discoveredSnoots.some(snoot => snoot.prompt === prompt)) {
                snootCount++;
                snootCountDisplay.textContent = snootCount;
                
                const newSnoot = {
                    prompt: prompt,
                    imageUrl: result.url
                };
                
                discoveredSnoots.push(newSnoot);
                addSnootToHistory(newSnoot);
            }
            
            setLoading(false);
            saveGameState();
        } catch (error) {
            console.error('Error generating snoot:', error);
            alert('Oops! Something went wrong generating your snoot. Please try again!');
            setLoading(false);
        }
    }
    
    // Function to add a snoot to the history display
    function addSnootToHistory(snoot) {
        const snootItem = document.createElement('div');
        snootItem.classList.add('snoot-item');
        snootItem.classList.add('cursor-enabled');
        
        const img = document.createElement('img');
        img.src = snoot.imageUrl;
        img.alt = snoot.prompt;
        img.title = snoot.prompt;
        
        snootItem.appendChild(img);
        snootItem.addEventListener('click', () => {
            snootImage.src = snoot.imageUrl;
            currentSnootPrompt = snoot.prompt;
            snootInput.value = snoot.prompt;
        });
        
        snootHistory.prepend(snootItem);
        
        // Limit the number of snoots shown to prevent performance issues
        if (snootHistory.children.length > 12) {
            snootHistory.removeChild(snootHistory.lastChild);
        }
    }
    
    // Function to show/hide loading indicator
    function setLoading(isLoading) {
        if (isLoading) {
            loadingIndicator.classList.remove('hidden');
            generateButton.disabled = true;
            randomButton.disabled = true;
        } else {
            loadingIndicator.classList.add('hidden');
            generateButton.disabled = false;
            randomButton.disabled = false;
        }
    }
    
    // Function to save game state to localStorage
    function saveGameState() {
        const gameState = {
            boopCount,
            snootCount,
            discoveredSnoots
        };
        
        localStorage.setItem('snootBooperState', JSON.stringify(gameState));
    }
    
    // Function to load game state from localStorage
    function loadGameState() {
        const savedState = localStorage.getItem('snootBooperState');
        
        if (savedState) {
            const gameState = JSON.parse(savedState);
            
            boopCount = gameState.boopCount || 0;
            snootCount = gameState.snootCount || 0;
            discoveredSnoots = gameState.discoveredSnoots || [];
            
            boopCountDisplay.textContent = boopCount;
            snootCountDisplay.textContent = snootCount;
            
            // Populate history
            discoveredSnoots.slice(-12).forEach(snoot => {
                addSnootToHistory(snoot);
            });
            
            // Load the most recent snoot if available
            if (discoveredSnoots.length > 0) {
                const lastSnoot = discoveredSnoots[discoveredSnoots.length - 1];
                snootImage.src = lastSnoot.imageUrl;
                currentSnootPrompt = lastSnoot.prompt;
            }
        }
    }
    
    // Generate default snoot if no saved state
    if (discoveredSnoots.length === 0) {
        generateRandomSnoot();
    }
});

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
@keyframes jiggle {
    0% { transform: scale(1); }
    25% { transform: scale(0.95); }
    50% { transform: scale(1.05); }
    75% { transform: scale(0.98); }
    100% { transform: scale(1); }
}
`;
document.head.appendChild(style);