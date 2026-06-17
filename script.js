const products = [
    {
        name: "Apple Watch Series 10",
        tag: "Novo Lançamento",
        image: "imagens/apple-watch.png",
        imageAlt: "Apple Watch Series 10",
        description:
            "Mais fino, mais elegante e mais poderoso do que nunca, o Apple Watch Series 10 chega para transformar a forma como você vive, treina e se conecta.",
        specs: [
            ["Tela", "OLED ampla e brilhante"],
            ["Destaque", "Monitoramento de saúde e treino"],
            ["Experiência", "Integração com notificações, apps e chamadas"]
        ]
    },
    {
        name: "AirPods Max",
        tag: "Som em Outro Nível",
        image: "imagens/air-pods.png",
        imageAlt: "AirPods Max",
        description:
            "Descubra uma nova dimensão de som com os AirPods Max, o fone mais avançado da Apple, criado para quem exige qualidade, conforto e tecnologia de ponta.",
        specs: [
            ["Áudio", "Som espacial e cancelamento ativo"],
            ["Conforto", "Estrutura premium para longas sessões"],
            ["Experiência", "Imersão para música, filmes e chamadas"]
        ]
    },
    {
        name: "Vision Pro",
        tag: "O Futuro Chegou",
        image: "imagens/vision-pro.png",
        imageAlt: "Apple Vision Pro",
        description:
            "Com ele, o mundo digital se mistura com o real, criando experiências totalmente imersivas. Você pode trabalhar, assistir, jogar e interagir como nunca antes.",
        specs: [
            ["Interface", "Computação espacial"],
            ["Uso", "Trabalho, entretenimento e colaboração"],
            ["Experiência", "Conteúdos digitais integrados ao ambiente real"]
        ]
    }
];

const items = document.querySelectorAll(".product-item");
const dots = document.querySelectorAll(".dot");
const number = document.querySelector(".numbers");
const nextButton = document.querySelector("#next");
const prevButton = document.querySelector("#prev");
const productList = document.querySelector(".product-list");

const productModal = document.querySelector("#product-modal");
const productDetailButtons = document.querySelectorAll("[data-product-details]");
const closeProductButtons = document.querySelectorAll("[data-close-product]");
const detailImage = document.querySelector("#detail-image");
const detailTag = document.querySelector("#detail-tag");
const detailTitle = document.querySelector("#detail-title");
const detailDescription = document.querySelector("#detail-description");
const detailSpecs = document.querySelector("#detail-specs");
const detailMessage = document.querySelector("#detail-message");
const favoriteProductButton = document.querySelector("#favorite-product");

const authModal = document.querySelector("#auth-modal");
const openLoginButtons = document.querySelectorAll("#open-login");
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
const FAVORITES_KEY = "portfolioStoreFavorites";
const AUTO_PLAY_TIME = 4500;

let currentIndex = 0;
let selectedProductIndex = 0;
let autoPlayId;
let resumeAutoPlayId;
let lastFocusedElement;

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

function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "{}");
    } catch {
        return {};
    }
}

function saveFavorites(favorites) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
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

function setModalState(modal, isOpen) {
    modal.classList.toggle("open", isOpen);
    modal.setAttribute("aria-hidden", String(!isOpen));
    document.body.classList.toggle("modal-open", document.querySelectorAll(".auth-modal.open, .product-modal.open").length > 0);
}

function updateFavoriteButton() {
    const session = getSession();

    if (!session) {
        favoriteProductButton.textContent = "Entrar para favoritar";
        return;
    }

    const favorites = getFavorites();
    const userFavorites = favorites[session.email] || [];
    const productName = products[selectedProductIndex].name;

    favoriteProductButton.textContent = userFavorites.includes(productName)
        ? "Remover dos favoritos"
        : "Adicionar aos favoritos";
}

function openProductModal(index) {
    const product = products[index];

    selectedProductIndex = index;
    lastFocusedElement = document.activeElement;
    detailImage.src = product.image;
    detailImage.alt = product.imageAlt;
    detailTag.textContent = product.tag;
    detailTitle.textContent = product.name;
    detailDescription.textContent = product.description;
    detailSpecs.innerHTML = product.specs
        .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
        .join("");
    setMessage(detailMessage, "");
    updateFavoriteButton();
    setModalState(productModal, true);
    stopAutoPlay();
    favoriteProductButton.focus();
}

function closeProductModal() {
    setModalState(productModal, false);
    startAutoPlay();
    lastFocusedElement?.focus();
}

function toggleFavoriteProduct() {
    const session = getSession();

    if (!session) {
        setMessage(detailMessage, "Faça login para salvar favoritos.", "error");
        closeProductModal();
        openAuthModal("login");
        return;
    }

    const favorites = getFavorites();
    const productName = products[selectedProductIndex].name;
    const userFavorites = favorites[session.email] || [];
    const isFavorite = userFavorites.includes(productName);

    favorites[session.email] = isFavorite
        ? userFavorites.filter((favorite) => favorite !== productName)
        : [...userFavorites, productName];

    saveFavorites(favorites);
    updateFavoriteButton();
    setMessage(detailMessage, isFavorite ? "Produto removido dos favoritos." : "Produto salvo nos favoritos.");
}

function switchAuthMode(mode) {
    authTabs.forEach((tab) => {
        const isActive = tab.dataset.authMode === mode;

        tab.classList.toggle("active", isActive);
        tab.setAttribute("aria-selected", String(isActive));
    });

    authForms.forEach((form) => {
        form.classList.toggle("active", form.id === `${mode}-form`);
    });

    setMessage(loginMessage, "");
    setMessage(signupMessage, "");
}

function openAuthModal(mode = "login") {
    lastFocusedElement = document.activeElement;
    switchAuthMode(mode);
    setModalState(authModal, true);
    pauseAutoPlayTemporarily();

    const activeInput = authModal.querySelector(".auth-form.active input");
    activeInput.focus();
}

function closeAuthModal() {
    setModalState(authModal, false);
    startAutoPlay();
    lastFocusedElement?.focus();
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
    updateFavoriteButton();
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

productDetailButtons.forEach((button) => {
    button.addEventListener("click", () => {
        openProductModal(Number(button.dataset.productDetails));
    });
});

closeProductButtons.forEach((button) => {
    button.addEventListener("click", closeProductModal);
});

favoriteProductButton.addEventListener("click", toggleFavoriteProduct);

productList.addEventListener("mouseenter", stopAutoPlay);
productList.addEventListener("mouseleave", startAutoPlay);

document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" && !document.body.classList.contains("modal-open")) {
        moveProduct(1);
    }

    if (event.key === "ArrowLeft" && !document.body.classList.contains("modal-open")) {
        moveProduct(-1);
    }

    if (event.key === "Escape" && productModal.classList.contains("open")) {
        closeProductModal();
    } else if (event.key === "Escape" && authModal.classList.contains("open")) {
        closeAuthModal();
    }
});

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

authTabs.forEach((tab) => {
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", String(tab.classList.contains("active")));
});

updateAuthUi();
startAutoPlay();
