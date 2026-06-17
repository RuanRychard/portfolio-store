const items = document.querySelectorAll(".product-item");
const dots = document.querySelectorAll(".dot");
const number = document.querySelector(".numbers");
const nextButton = document.querySelector("#next");
const prevButton = document.querySelector("#prev");
const productList = document.querySelector(".product-list");

const authModal = document.querySelector("#auth-modal");
const openLoginButtons = document.querySelectorAll("#open-login, [data-open-login]");
const closeLoginButtons = document.querySelectorAll("[data-close-login]");
const authTabs = document.querySelectorAll(".auth-tab");
const authForms = document.querySelectorAll(".auth-form");
const loginForm = document.querySelector("#login-form");
const signupForm = document.querySelector("#signup-form");
const loginMessage = document.querySelector("#login-message");
const signupMessage = document.querySelector("#signup-message");
const userChip = document.querySelector("#user-chip");
const loginTrigger = document.querySelector("#open-login");
const logoutButton = document.querySelector("#logout-btn");
const recoverPassword = document.querySelector("#recover-password");
const signupPassword = document.querySelector("#signup-password");
const passwordMeter = document.querySelector(".password-meter");

const USERS_KEY = "portfolioStoreUsers";
const SESSION_KEY = "portfolioStoreSession";
const AUTO_PLAY_TIME = 4500;

let currentIndex = 0;
let autoPlayId;
let resumeAutoPlayId;

function showProduct(index) {
    const previousIndex = currentIndex;
    currentIndex = (index + items.length) % items.length;

    items.forEach((item, itemIndex) => {
        item.classList.toggle("active", itemIndex === currentIndex);
        item.classList.toggle("is-leaving", itemIndex === previousIndex && previousIndex !== currentIndex);
    });

    dots.forEach((dot, dotIndex) => {
        dot.classList.toggle("active", dotIndex === currentIndex);
    });

    number.textContent = String(currentIndex + 1).padStart(2, "0");
}

function startAutoPlay() {
    stopAutoPlay();
    autoPlayId = setInterval(() => {
        showProduct(currentIndex + 1);
    }, AUTO_PLAY_TIME);
}

function stopAutoPlay() {
    clearInterval(autoPlayId);
}

function pauseAutoPlayTemporarily() {
    stopAutoPlay();
    clearTimeout(resumeAutoPlayId);
    resumeAutoPlayId = setTimeout(startAutoPlay, 9000);
}

function moveProduct(step) {
    showProduct(currentIndex + step);
    pauseAutoPlayTemporarily();
}

nextButton.addEventListener("click", () => {
    moveProduct(1);
});

prevButton.addEventListener("click", () => {
    moveProduct(-1);
});

dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
        showProduct(index);
        pauseAutoPlayTemporarily();
    });
});

productList.addEventListener("mouseenter", stopAutoPlay);
productList.addEventListener("mouseleave", startAutoPlay);

document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
        moveProduct(1);
    }

    if (event.key === "ArrowLeft") {
        moveProduct(-1);
    }

    if (event.key === "Escape" && authModal.classList.contains("open")) {
        closeAuthModal();
    }
});

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY) || "null");
    } catch {
        return null;
    }
}

function saveSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
        name: user.name,
        email: user.email,
        loggedAt: new Date().toISOString()
    }));
}

function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

function normalizeEmail(email) {
    return email.trim().toLowerCase();
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function hashPassword(password) {
    if (window.crypto?.subtle) {
        const encodedPassword = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", encodedPassword);
        const hashArray = Array.from(new Uint8Array(hashBuffer));

        return `sha256:${hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
    }

    let hash = 2166136261;

    for (let index = 0; index < password.length; index++) {
        hash ^= password.charCodeAt(index);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }

    return `fnv:${(hash >>> 0).toString(16)}`;
}

function getPasswordScore(password) {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return score;
}

function setFieldError(input, message = "") {
    const field = input.closest(".field");
    const small = field.querySelector("small");

    field.classList.toggle("error", Boolean(message));
    small.textContent = message;
}

function clearFormErrors(form) {
    form.querySelectorAll(".field").forEach((field) => {
        field.classList.remove("error");
        field.querySelector("small").textContent = "";
    });
}

function setMessage(element, text, type = "success") {
    element.textContent = text;
    element.classList.toggle("error", type === "error");
}

function switchAuthMode(mode) {
    authTabs.forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.authMode === mode);
    });

    authForms.forEach((form) => {
        form.classList.toggle("active", form.id === `${mode}-form`);
    });

    setMessage(loginMessage, "");
    setMessage(signupMessage, "");
}

function openAuthModal(mode = "login") {
    switchAuthMode(mode);
    authModal.classList.add("open");
    authModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    pauseAutoPlayTemporarily();

    const activeInput = authModal.querySelector(".auth-form.active input");
    activeInput.focus();
}

function closeAuthModal() {
    authModal.classList.remove("open");
    authModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    startAutoPlay();
}

function updateAuthUi() {
    const session = getSession();

    if (!session) {
        userChip.hidden = true;
        loginTrigger.hidden = false;
        logoutButton.hidden = true;
        return;
    }

    userChip.textContent = `Olá, ${session.name.split(" ")[0]}`;
    userChip.hidden = false;
    loginTrigger.hidden = true;
    logoutButton.hidden = false;
}

function validateLogin() {
    const emailInput = document.querySelector("#login-email");
    const passwordInput = document.querySelector("#login-password");
    const email = normalizeEmail(emailInput.value);
    const password = passwordInput.value;
    let valid = true;

    clearFormErrors(loginForm);
    setMessage(loginMessage, "");

    if (!isValidEmail(email)) {
        setFieldError(emailInput, "Digite um e-mail válido.");
        valid = false;
    }

    if (!password) {
        setFieldError(passwordInput, "Digite sua senha.");
        valid = false;
    }

    return valid;
}

function validateSignup() {
    const nameInput = document.querySelector("#signup-name");
    const emailInput = document.querySelector("#signup-email");
    const passwordInput = document.querySelector("#signup-password");
    const confirmInput = document.querySelector("#signup-confirm");
    const termsInput = document.querySelector("#signup-terms");
    const users = getUsers();
    const email = normalizeEmail(emailInput.value);
    let valid = true;

    clearFormErrors(signupForm);
    setMessage(signupMessage, "");

    if (nameInput.value.trim().length < 3) {
        setFieldError(nameInput, "Informe pelo menos 3 caracteres.");
        valid = false;
    }

    if (!isValidEmail(email)) {
        setFieldError(emailInput, "Digite um e-mail válido.");
        valid = false;
    } else if (users.some((user) => user.email === email)) {
        setFieldError(emailInput, "Este e-mail já tem uma conta.");
        valid = false;
    }

    if (getPasswordScore(passwordInput.value) < 4) {
        setFieldError(passwordInput, "Crie uma senha mais forte.");
        valid = false;
    }

    if (confirmInput.value !== passwordInput.value) {
        setFieldError(confirmInput, "As senhas não conferem.");
        valid = false;
    }

    if (!termsInput.checked) {
        setMessage(signupMessage, "Aceite as novidades para continuar.", "error");
        valid = false;
    }

    return valid;
}

openLoginButtons.forEach((button) => {
    button.addEventListener("click", () => openAuthModal("login"));
});

closeLoginButtons.forEach((button) => {
    button.addEventListener("click", closeAuthModal);
});

authTabs.forEach((tab) => {
    tab.addEventListener("click", () => switchAuthMode(tab.dataset.authMode));
});

document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", () => {
        const input = document.querySelector(`#${button.dataset.passwordToggle}`);
        const isPassword = input.type === "password";

        input.type = isPassword ? "text" : "password";
        button.textContent = isPassword ? "Ocultar" : "Mostrar";
        button.setAttribute("aria-label", isPassword ? "Ocultar senha" : "Mostrar senha");
    });
});

signupPassword.addEventListener("input", () => {
    const score = getPasswordScore(signupPassword.value);
    const width = Math.min(score * 20, 100);
    const meterBar = passwordMeter.querySelector("span");

    meterBar.style.width = `${width}%`;
    passwordMeter.classList.toggle("medium", score >= 3 && score < 5);
    passwordMeter.classList.toggle("strong", score >= 5);
});

signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateSignup()) return;

    const user = {
        name: document.querySelector("#signup-name").value.trim(),
        email: normalizeEmail(document.querySelector("#signup-email").value),
        passwordHash: await hashPassword(document.querySelector("#signup-password").value)
    };
    const users = getUsers();

    users.push(user);
    saveUsers(users);
    saveSession(user);
    updateAuthUi();
    signupForm.reset();
    passwordMeter.querySelector("span").style.width = "0";
    setMessage(signupMessage, "Conta criada com sucesso.");

    setTimeout(closeAuthModal, 700);
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateLogin()) return;

    const email = normalizeEmail(document.querySelector("#login-email").value);
    const password = document.querySelector("#login-password").value;
    const remember = document.querySelector("#remember-login").checked;
    const passwordHash = await hashPassword(password);
    const users = getUsers();
    const user = users.find((account) => {
        return account.email === email && (account.passwordHash === passwordHash || account.password === password);
    });

    if (!user) {
        setMessage(loginMessage, "E-mail ou senha incorretos.", "error");
        return;
    }

    if (!user.passwordHash) {
        user.passwordHash = passwordHash;
        delete user.password;
        saveUsers(users);
    }

    if (remember) {
        saveSession(user);
    } else {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({
            name: user.name,
            email: user.email,
            loggedAt: new Date().toISOString()
        }));
    }

    updateAuthUi();
    loginForm.reset();
    setMessage(loginMessage, "Login realizado com sucesso.");

    setTimeout(closeAuthModal, 700);
});

logoutButton.addEventListener("click", () => {
    clearSession();
    sessionStorage.removeItem(SESSION_KEY);
    updateAuthUi();
});

recoverPassword.addEventListener("click", () => {
    const email = normalizeEmail(document.querySelector("#login-email").value);

    if (!isValidEmail(email)) {
        setMessage(loginMessage, "Digite seu e-mail para simular a recuperação.", "error");
        return;
    }

    setMessage(loginMessage, "Enviamos instruções de recuperação para seu e-mail.");
});

window.addEventListener("storage", updateAuthUi);

updateAuthUi();
startAutoPlay();
