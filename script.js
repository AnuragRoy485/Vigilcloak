const authContainer = document.getElementById("auth-container");
const trackerContainer = document.getElementById("tracker-container");
const authTitle = document.getElementById("auth-title");
const authActionBtn = document.getElementById("auth-action-btn");
const toggleAuth = document.getElementById("toggle-auth");
const authError = document.getElementById("auth-error");

let isLoginMode = true;
let isAuthenticated = false;

// IP-based routing logic
window.onload = function () {
  const savedEmail = localStorage.getItem("savedEmail");
  if (savedEmail) {
    document.getElementById("email").value = savedEmail;
  }

  fetch("https://ipinfo.io?token=YOUR_API_TOKEN")
    .then((response) => response.json())
    .then((data) => {
      if (data.country !== "IN") {
        window.location.href = "http://your-website-url.in"; // Redirect logic
      }
    })
    .catch((err) => console.error("IP fetch error:", err));
};

// Toggle between login and register mode
toggleAuth.addEventListener("click", () => {
  isLoginMode = !isLoginMode;
  authTitle.textContent = isLoginMode ? "Login" : "Register";
  authActionBtn.textContent = isLoginMode ? "Login" : "Register";
  toggleAuth.innerHTML = isLoginMode
    ? `Don’t have an account? <a href="#">Register</a>`
    : `Already have an account? <a href="#">Login</a>`;
});

// Handle login and register actions
authActionBtn.addEventListener("click", () => {
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    authError.textContent = "Please enter both email and password.";
    return;
  }

  if (!email.endsWith("@gov.in") && !email.endsWith("@nic.in")) {
    authError.textContent = "Only gov.in or nic.in emails are allowed.";
    return;
  }

  if (isLoginMode) {
    const userData = JSON.parse(localStorage.getItem(email));

    if (userData && userData.password === password) {
      isAuthenticated = true;
      localStorage.setItem("savedEmail", email);
      authContainer.classList.add("hidden");
      trackerContainer.classList.remove("hidden");
      authError.textContent = ""; // Clear any error messages
    } else {
      authError.textContent = "Invalid email or password.";
    }
  } else {
    if (localStorage.getItem(email)) {
      authError.textContent = "Account already exists. Please log in.";
    } else {
      const userData = { password };
      localStorage.setItem(email, JSON.stringify(userData));
      authError.textContent = "Registration successful! Please log in.";
    }
  }
});

// Track button event listener
document.getElementById("track-btn").addEventListener("click", () => {
  if (!isAuthenticated) {
    alert("You must log in to use the tracker.");
    return;
  }

  const cryptoType = document.getElementById("crypto-type").value;
  const address = document.getElementById("address").value.trim();

  if (!address) {
    document.getElementById("results").innerHTML =
      '<p class="error">Please enter a wallet address.</p>';
    return;
  }

  cryptoType === "btc"
    ? fetchBitcoinTransactions(address)
    : fetchEthereumTransactions(address);
});

// Fetch Bitcoin transactions
function fetchBitcoinTransactions(address) {
  const url = `https://api.blockcypher.com/v1/btc/main/addrs/${address}/full`;
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      displayCryptoResults(data, "Bitcoin");
      renderSankeyDiagram(data.txs, "Bitcoin");
    })
    .catch(() => {
      document.getElementById("results").innerHTML =
        '<p class="error">Failed to fetch Bitcoin transactions.</p>';
    });
}

// Fetch Ethereum transactions
function fetchEthereumTransactions(address) {
  const url = `https://api.blockcypher.com/v1/eth/main/addrs/${address}/full`;
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      displayCryptoResults(data, "Ethereum");
      renderSankeyDiagram(data.txs, "Ethereum");
    })
    .catch(() => {
      document.getElementById("results").innerHTML =
        '<p class="error">Failed to fetch Ethereum transactions.</p>';
    });
}

// Display transaction details
function displayCryptoResults(data, cryptoType) {
  let html = `<h2>${cryptoType} Transactions</h2>`;
  const icon =
    cryptoType === "Bitcoin"
      ? "https://cryptologos.cc/logos/bitcoin-btc-logo.png"
      : "https://cryptologos.cc/logos/ethereum-eth-logo.png";

  if (!data.txs?.length) {
    html += '<p class="error">No transactions found.</p>';
  } else {
    data.txs.forEach((tx) => {
      const inputs = tx.inputs?.map((i) => i.addresses).flat() || ["N/A"];
      const outputs = tx.outputs?.map((o) => o.addresses).flat() || ["N/A"];
      const amount = (
        tx.outputs?.reduce((a, b) => a + b.value, 0) / 1e8
      ).toFixed(8);
      const timestamp = new Date(tx.confirmed).toLocaleString();
      const hash = tx.hash;

      html += `
        <div class="transaction">
          <div class="transaction-header">
            <h3>Transaction Hash: 
              <span class="transaction-hash" data-full-hash="${hash}">
                ${hash.slice(0, 6)}...${hash.slice(-6)}
              </span>
            </h3>
            <img src="${icon}" alt="${cryptoType} Icon" class="crypto-icon">
          </div>
          <p><strong>Date & Time:</strong> ${timestamp}</p>
          <ul class="address-list">
            <li><strong>From:</strong> ${inputs.join(", ")}</li>
            <li><strong>To:</strong> ${outputs.join(", ")}</li>
          </ul>
          <p class="amount ${cryptoType.toLowerCase()}">${amount} ${cryptoType}</p>
        </div>`;
    });
  }
  document.getElementById("results").innerHTML = html;
}

// Logout button event listener
document.getElementById("logout-btn").addEventListener("click", () => {
  isAuthenticated = false;
  authContainer.classList.remove("hidden");
  trackerContainer.classList.add("hidden");
});
