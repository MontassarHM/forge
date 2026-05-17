const USERS_KEY = "app_users";
const CURRENT_USER_KEY = "current_user";
const SESSION_KEY = "user_session";

// Simple hash (for demo only, not secure)
const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return hash.toString(16) + str.length.toString(16);
};

// Generate a mock token
const generateToken = (userId) => {
    const payload = {
        userId,
        iat: Date.now(),
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };
    return btoa(JSON.stringify(payload));
};

// Decode a token
const decodeToken = (token) => {
    try {
        return JSON.parse(atob(token));
    } catch {
        return null;
    }
};

// Check if a token is valid
const isTokenValid = (token) => {
    const decoded = decodeToken(token);
    if (!decoded) return false;
    return decoded.exp > Date.now();
};

// ================================
// User Helpers
// ================================
const getUsers = () => {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
};

const saveUsers = (users) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// ================================
// REGISTRATION
// ================================
export const register = async (email, name, password) => {
    // Validation
    if (!email || !name || !password) {
        throw new Error("All fields are required");
    }

    if (!isValidEmail(email)) {
        throw new Error("Invalid email");
    }

    if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
    }

    if (name.length < 2) {
        throw new Error("Name must be at least 2 characters");
    }

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 500));

    const users = getUsers();

    // Check if email already exists
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("This email is already in use");
    }

    // Create new user
    const newUser = {
        id: `user_${Date.now()}`,
        email: email.toLowerCase(),
        name,
        passwordHash: simpleHash(password),
        avatar: name.substring(0, 2).toUpperCase(),
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    // Generate token
    const token = generateToken(newUser.id);

    // Save session
    const userData = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        avatar: newUser.avatar,
        createdAt: newUser.createdAt,
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
    localStorage.setItem(SESSION_KEY, token);

    return { user: userData, token };
};

// ================================
// LOGIN
// ================================
export const login = async (email, password) => {
    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    // Simulate network delay
    await new Promise((r) => setTimeout(r, 500));

    const users = getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        throw new Error("Incorrect email or password");
    }

    if (user.passwordHash !== simpleHash(password)) {
        throw new Error("Incorrect email or password");
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    saveUsers(users);

    // Generate token
    const token = generateToken(user.id);

    const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        createdAt: user.createdAt,
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
    localStorage.setItem(SESSION_KEY, token);

    return { user: userData, token };
};

// ================================
// LOGOUT
// ================================
export const logout = async () => {
    await new Promise((r) => setTimeout(r, 200));
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(SESSION_KEY);
};

// ================================
// CURRENT USER
// ================================
export const getCurrentUser = () => {
    const token = localStorage.getItem(SESSION_KEY);
    if (!token || !isTokenValid(token)) {
        logout();
        return null;
    }

    const user = localStorage.getItem(CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
    const token = localStorage.getItem(SESSION_KEY);
    return token && isTokenValid(token);
};

export const getToken = () => {
    return localStorage.getItem(SESSION_KEY);
};

// ================================
// UPDATE PROFILE
// ================================
export const updateProfile = async (updates) => {
    const currentUser = getCurrentUser();
    if (!currentUser) throw new Error("Not logged in");

    const users = getUsers();
    const userIndex = users.findIndex((u) => u.id === currentUser.id);

    if (userIndex === -1) throw new Error("User not found");

    users[userIndex] = { ...users[userIndex], ...updates };
    saveUsers(users);

    const updatedUser = {
        ...currentUser,
        ...updates,
    };

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
};