// ============================================================
// CONFIGURATION
// ============================================================

// Change this to your backend URL.
//
// During local testing:
// http://localhost:5000
//
// When using a tunnel:
// https://your-api-domain.example
//
const API_BASE_URL = "http://localhost:5000";


// Where the user goes after successful verification.
//
// Change this to the URL of your internal site.
const INTERNAL_SITE_URL = "../internal/index.html";


// ============================================================
// ELEMENTS
// ============================================================

const phoneStep = document.getElementById("phoneStep");
const codeStep = document.getElementById("codeStep");

const phoneInput = document.getElementById("phone");
const codeInput = document.getElementById("code");

const phoneDisplay = document.getElementById("phoneDisplay");

const sendButton = document.getElementById("sendCode");
const verifyButton = document.getElementById("verifyCode");
const backButton = document.getElementById("backButton");

const message = document.getElementById("message");


// Keep the phone number in memory while verification is happening.
let currentPhone = "";


// ============================================================
// MESSAGE HANDLING
// ============================================================

function setMessage(text, type = "") {

    message.textContent = text;

    message.className = "message";

    if (type) {
        message.classList.add(type);
    }
}


// ============================================================
// PHONE FORMATTING
// ============================================================

function cleanPhoneNumber(phone) {

    return phone.replace(/[^\d+]/g, "");
}


function maskPhone(phone) {

    const digits = phone.replace(/\D/g, "");

    if (digits.length < 4) {
        return phone;
    }

    return "••• ••• " + digits.slice(-4);
}


// ============================================================
// SEND VERIFICATION CODE
// ============================================================

sendButton.addEventListener("click", async () => {

    const phone = cleanPhoneNumber(phoneInput.value.trim());

    if (!phone) {

        setMessage(
            "Enter your phone number first.",
            "error"
        );

        return;
    }


    const digits = phone.replace(/\D/g, "");

    if (digits.length < 10) {

        setMessage(
            "Enter a valid phone number.",
            "error"
        );

        return;
    }


    currentPhone = phone;

    sendButton.disabled = true;

    sendButton.textContent = "Sending…";

    setMessage("");


    try {

        const response = await fetch(
            `${API_BASE_URL}/api/send-code`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    phone: phone
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error || "Unable to send verification code."
            );
        }


        phoneDisplay.textContent = maskPhone(phone);


        phoneStep.hidden = true;

        codeStep.hidden = false;


        setMessage(
            "Verification code sent.",
            "success"
        );


        codeInput.value = "";

        codeInput.focus();

    }

    catch (error) {

        console.error(error);

        setMessage(
            error.message ||
            "Something went wrong. Please try again.",
            "error"
        );

    }

    finally {

        sendButton.disabled = false;

        sendButton.innerHTML =
            'Continue <span>→</span>';
    }

});


// ============================================================
// VERIFY CODE
// ============================================================

verifyButton.addEventListener("click", async () => {

    const code = codeInput.value.trim();


    if (!currentPhone) {

        setMessage(
            "No verification request exists.",
            "error"
        );

        return;
    }


    if (!/^\d{6}$/.test(code)) {

        setMessage(
            "Enter the 6-digit verification code.",
            "error"
        );

        return;
    }


    verifyButton.disabled = true;

    verifyButton.textContent = "Verifying…";

    setMessage("");


    try {

        const response = await fetch(
            `${API_BASE_URL}/api/verify-code`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "include",

                body: JSON.stringify({
                    phone: currentPhone,
                    code: code
                })
            }
        );


        const data = await response.json();


        if (!response.ok || !data.verified) {

            throw new Error(
                data.error ||
                "Incorrect verification code."
            );
        }


        setMessage(
            "Identity verified.",
            "success"
        );


        verifyButton.textContent = "Verified ✓";


        // Give the success message a moment
        // before redirecting.
        setTimeout(() => {

            window.location.href =
                INTERNAL_SITE_URL;

        }, 900);

    }

    catch (error) {

        console.error(error);

        setMessage(
            error.message ||
            "Verification failed.",
            "error"
        );

        verifyButton.disabled = false;

        verifyButton.textContent =
            "Verify";

    }

});


// ============================================================
// GO BACK
// ============================================================

backButton.addEventListener("click", () => {

    currentPhone = "";

    codeInput.value = "";

    phoneStep.hidden = false;

    codeStep.hidden = true;

    setMessage("");

    phoneInput.focus();

});


// ============================================================
// ENTER KEY SUPPORT
// ============================================================

phoneInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {

        sendButton.click();

    }

});


codeInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {

        verifyButton.click();

    }

});


// ============================================================
// ONLY ALLOW NUMBERS IN OTP FIELD
// ============================================================

codeInput.addEventListener("input", () => {

    codeInput.value =
        codeInput.value.replace(/\D/g, "").slice(0, 6);

});
