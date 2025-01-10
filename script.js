// Character mapping for hex to zero-width conversion
const characterMapping = {
    '0': '\u200B', // ZERO WIDTH SPACE
    '1': '\u200C', // ZERO WIDTH NON-JOINER
    '2': '\u200D', // ZERO WIDTH JOINER
    '3': '\u200E', // LEFT-TO-RIGHT MARK
    '4': '\u200F', // RIGHT-TO-LEFT MARK
    '5': '\uFEFF', // ZERO WIDTH NO-BREAK SPACE
    '6': '\u2060', // WORD JOINER
    '7': '\u2061', // FUNCTION APPLICATION
    '8': '\u2062', // INVISIBLE TIMES
    '9': '\u2063', // INVISIBLE SEPARATOR
    'a': '\u2064', // INVISIBLE PLUS
    'b': '\u206A', // INHIBIT SYMMETRIC SWAPPING
    'c': '\u206B', // ACTIVATE SYMMETRIC SWAPPING
    'd': '\u206C', // INHIBIT ARABIC FORM SHAPING
    'e': '\u206D', // ACTIVATE ARABIC FORM SHAPING
    'f': '\u206E'  // NATIONAL DIGIT SHAPES
};

// Reverse mapping for zero-width to hex conversion
const reverseMapping = Object.fromEntries(
    Object.entries(characterMapping).map(([k, v]) => [v, k])
);

// Elements
const secretMessage = document.getElementById('secretMessage');
const visibleMessage = document.getElementById('visibleMessage');
const encodedMessage = document.getElementById('encodedMessage');
const output = document.getElementById('output');
const encodeFileInput = document.getElementById('encodeFileInput');
const decodeFileInput = document.getElementById('decodeFileInput');
const encodeBtn = document.getElementById('encodeBtn');
const decodeBtn = document.getElementById('decodeBtn');
const copyBtn = document.getElementById('copy');
const downloadBtn = document.getElementById('download');
const notification = document.getElementById('notification');
const encodeSection = document.getElementById('encodeSection');
const decodeSection = document.getElementById('decodeSection');
const radioButtons = document.querySelectorAll('input[name="conversionType"]');

// Show notification
function showNotification(message, isError = false) {
    notification.textContent = message;
    notification.className = 'notification' + (isError ? ' error' : '');
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Convert text to hex
function textToHex(text) {
    return Array.from(text)
        .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('');
}

// Convert hex to text
function hexToText(hex) {
    const hexes = hex.match(/.{1,2}/g) || [];
    return hexes.map(h => String.fromCharCode(parseInt(h, 16))).join('');
}

// Convert text directly to zero-width characters with optional visible message
function textToZeroWidth(text, visible = '') {
    // First convert text to hex
    const hex = textToHex(text);
    // Then convert hex to zero-width
    const zeroWidth = Array.from(hex.toLowerCase())
        .map(c => characterMapping[c] || c)
        .join('');
    
    // If there's a visible message, insert the zero-width characters at a random position
    if (visible) {
        const position = Math.floor(Math.random() * visible.length);
        return visible.slice(0, position) + zeroWidth + visible.slice(position);
    }
    
    return zeroWidth;
}

// Convert zero-width characters to text, ignoring visible characters
function zeroWidthToText(mixed) {
    // Extract only zero-width characters
    const zeroWidth = mixed.split('').filter(char => {
        const code = char.charCodeAt(0);
        return Object.values(characterMapping).some(mapping => mapping.charCodeAt(0) === code);
    }).join('');
    
    // Convert zero-width to hex
    const hex = Array.from(zeroWidth)
        .map(c => reverseMapping[c] || c)
        .join('');
    
    // Then convert hex to text
    return hexToText(hex);
}

// Handle large file reading
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event.target.result);
        reader.onerror = error => reject(error);
        reader.readAsText(file);
    });
}

// Switch between encode and decode sections
function switchSection(type) {
    if (type === 'encode') {
        encodeSection.classList.remove('hidden');
        decodeSection.classList.add('hidden');
        output.value = '';
    } else {
        decodeSection.classList.remove('hidden');
        encodeSection.classList.add('hidden');
        output.value = '';
    }
}

// Event Listeners
radioButtons.forEach(radio => {
    radio.addEventListener('change', (e) => {
        switchSection(e.target.value);
    });
});

encodeBtn.addEventListener('click', () => {
    const text = secretMessage.value;
    const visible = visibleMessage.value;
    
    if (!text) {
        showNotification('Please enter a secret message to hide', true);
        return;
    }
    
    try {
        output.value = textToZeroWidth(text, visible);
        showNotification('Successfully converted to zero-width characters!');
    } catch (error) {
        console.error('Conversion error:', error);
        showNotification('Error during conversion. Please check your input.', true);
    }
});

decodeBtn.addEventListener('click', () => {
    const mixed = encodedMessage.value;
    if (!mixed) {
        showNotification('Please enter text to decode', true);
        return;
    }
    
    try {
        output.value = zeroWidthToText(mixed);
        showNotification('Successfully extracted hidden message!');
    } catch (error) {
        console.error('Conversion error:', error);
        showNotification('Error during conversion. Please check your input.', true);
    }
});

encodeFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        const content = await readFile(file);
        secretMessage.value = content;
    } catch (error) {
        console.error('Error reading file:', error);
        showNotification('Error reading file. Please try again.', true);
    }
});

decodeFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        const content = await readFile(file);
        encodedMessage.value = content;
    } catch (error) {
        console.error('Error reading file:', error);
        showNotification('Error reading file. Please try again.', true);
    }
});

copyBtn.addEventListener('click', async () => {
    if (!output.value) {
        showNotification('Nothing to copy!', true);
        return;
    }
    
    try {
        await navigator.clipboard.writeText(output.value);
        showNotification('Copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy:', err);
        showNotification('Failed to copy to clipboard!', true);
    }
});

downloadBtn.addEventListener('click', () => {
    if (!output.value) {
        showNotification('Nothing to download!', true);
        return;
    }
    
    const blob = new Blob([output.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted_text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('File downloaded successfully!');
});

// Add paste button functionality
document.querySelectorAll('.paste-button').forEach(button => {
    button.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            const targetId = button.dataset.target;
            const textarea = document.getElementById(targetId);
            if (textarea) {
                textarea.value = text;
                showNotification('Text pasted successfully!');
            }
        } catch (err) {
            showNotification('Failed to paste text. Please try again.', true);
        }
    });
});
