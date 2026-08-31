const inputBox = document.getElementById('inputBox');
const outputBox = document.getElementById('outputBox');
const inputLang = document.getElementById('inputLang');
const outputLang = document.getElementById('outputLang');
const langSwitch = document.getElementById('langSwitch');
const clearInput = document.getElementById('clearInput');
const copyOutput = document.getElementById('copyOutput');
const inputTTS = document.getElementById('inputTTS');
const outputTTS = document.getElementById('outputTTS');
const inputFlag = document.getElementById('inputFlag');
const outputFlag = document.getElementById('outputFlag');
const slangBox = document.getElementById('slangBox');

let languages = {};


// Loads languages.json and adds them into the selector slider
async function loadLanguages() {
    try {
        const response = await fetch('languages.json');
        if (!response.ok) throw new Error('ERROR: Language file failed to load');

        languages = await response.json()

        Object.entries(languages).forEach(([langCode, langData]) => {
            const optionIn = document.createElement('option');
            optionIn.value = langCode;
            optionIn.textContent = langData.name;
            inputLang.appendChild(optionIn);

            const optionOut = document.createElement('option');
            optionOut.value = langCode;
            optionOut.textContent = langData.name;
            outputLang.appendChild(optionOut);

        });

        // Set default languages on the slider to minimise problems
        inputLang.value = 'en';
        outputLang.value = 'fr';

    } catch (error) {
        console.error("Error loading languages for dropdown menu", error);
    }
}

function updateFlagIcon() {

    // Do nothing if JSON file not read
    if (!languages[inputLang.value] || !languages[outputLang.value]) return;

    const inputCountry = languages[inputLang.value].imageCode;
    const outputCountry = languages[outputLang.value].imageCode;

    inputFlag.src = `https://flagcdn.com/w80/${inputCountry}.png`;
    outputFlag.src = `https://flagcdn.com/w80/${outputCountry}.png`;

}
function isValidInput(text) {
    if (text.trim() === '') return false;

    // Count letters in the text
    const letters = text.replace(/[^a-zA-Z]/g, '').length;

    // At least 2 letters and 50% of characters are letters
    const letterRatio = letters / text.length;
    return letters >= 2 && letterRatio >= 0.5;
}
async function translate() {
    const text = inputBox.value;
    const sourceLanguage = inputLang.value;
    const targetLanguage = outputLang.value;

    if (text.trim() === '') return;

    outputBox.textContent = 'Translating...';

    try {
        const response = await fetch('https://language-analyser-production.up.railway.app/translation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                sourceLanguage: sourceLanguage,
                targetLanguage: targetLanguage
            })
        });

        const data = await response.json();
        outputBox.textContent = data.translation;

        if (data.slangs && data.slangs.length > 0) {
            slangBox.style.display = 'block';
            slangBox.innerHTML = '<h3>Slang Detected</h3>';
            data.slangs.forEach(slang => {
                const item = document.createElement('div');
                item.className = 'slang-item';
                item.innerHTML = `<strong>${slang.word}</strong> — ${slang.meaning}`;
                slangBox.appendChild(item);
            });
        } else {
            slangBox.style.display = 'none';
            slangBox.innerHTML = '';
        }

    } catch (error) {
        outputBox.textContent = 'Error connecting to server';
        slangBox.style.display = 'none';
        slangBox.innerHTML = '';
    }
}

// Only send translation request when the user has stopped typing
let typingTimer;
const doneTypingInterval = 800; // Time in millseconds (0.8 seconds)
// Translate when user stops typing
inputBox.addEventListener('input', () => {
    clearTimeout(typingTimer);

    if (inputBox.value.trim() !== '') {
        if (!isValidInput(inputBox.value)) {
            outputBox.textContent = 'Please enter valid text to translate.';
            slangBox.style.display = 'none';
            slangBox.innerHTML = '';
        } else {
            typingTimer = setTimeout(translate, doneTypingInterval);
        }
    } else {
        outputBox.textContent = '';
        slangBox.style.display = 'none';
        slangBox.innerHTML = '';
    }
})

// Clear button
clearInput.addEventListener('click', () => {
    inputBox.value = '';
    outputBox.textContent = '';
});

// Copy button
copyOutput.addEventListener('click', () => {
    navigator.clipboard.writeText(outputBox.textContent);
});

// Swap languages
langSwitch.addEventListener('click', () => {
    const temp = inputLang.value;
    inputLang.value = outputLang.value;
    outputLang.value = temp;
    updateFlagIcon();

    // Store the text
    const currentInput = inputBox.value;
    const currentOutput = outputBox.textContent;

    const invalidOutputs = [
        'Translation', 
        'Translating...', 
        'Error connecting to server', 
        'Please enter valid text to translate.'
    ];
    
    if (!invalidOutputs.includes(currentOutput) && currentOutput.trim() !== '') {
        inputBox.value = currentOutput;        
        outputBox.textContent = currentInput;
    }

    else if (currentInput.trim() !== '') {
        translate();
    }
    
});

// Text to speech
inputTTS.addEventListener('click', () => {
    const speech = new SpeechSynthesisUtterance(inputBox.value);
    speech.lang = inputLang.value;
    window.speechSynthesis.speak(speech);
});

outputTTS.addEventListener('click', () => {
    const speech = new SpeechSynthesisUtterance(outputBox.textContent);
    speech.lang = outputLang.value;
    window.speechSynthesis.speak(speech);
});

// Dropdown Menu Updater
inputLang.addEventListener('change', updateFlagIcon);
outputLang.addEventListener('change', updateFlagIcon);

loadLanguages()