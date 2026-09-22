"use strict";

/*
 * ============================================================
 * CONFIGURATION
 * ============================================================
 *
 * Development:
 *     http://localhost:5000
 *
 * Production:
 *     https://api.yourdomain.com
 *
 * Do NOT put SMS-provider secrets in this file.
 */

const API_BASE_URL = "https://api.yourdomain.com";

const INTERNAL_SITE_URL =
    "https://internal.yourdomain.com/";


/*
 * ============================================================
 * DOM
 * ============================================================
 */

const verificationCard =
    document.getElementById("verificationCard");

const phoneStep =
    document.getElementById("phoneStep");

const codeStep =
    document.getElementById("codeStep");

const phoneInput =
    document.getElementById("phone");

const codeInput =
    document.getElementById("code");

const phoneDisplay =
    document.getElementById("phoneDisplay");

const sendButton =
    document.getElementById("sendCode");

const verifyButton =
    document.getElementById("verifyCode");

const backButton =
    document.getElementById("backButton");

const message =
    document.getElementById("message");


/*
 * ============================================================
 * STATE
 * ============================================================
 */

let currentPhone = "";

let requestInProgress = false;


/*
 * ============================================================
 * STATUS
 * ============================================================
 */

function setMessage(text, type = "") {

    message.textContent = text;

    message.className = "status";

    if (type) {
        message.classList.add(type);
    }
}


/*
 * ============================================================
 * PHONE
 * ============================================================
 */

function normalizePhone(phone) {

    return phone
        .trim()
        .replace(/[^\d+]/g, "");
}


function maskPhone(phone) {

    const digits =
        phone.replace(/\D/g, "");

    if (digits.length < 4) {
        return phone;
    }

    return `••• ••• ${digits.slice(-4)}`;
}


/*
 * ============================================================
 * STEP TRANSITION
 * ============================================================
 *
 * The transition starts from the currently displayed state.
 * We don't use a delayed "wait for animation to finish"
 * before accepting the next action.
 */

function showCodeStep() {

    phoneStep.hidden = true;

    codeStep.hidden = false;

    codeStep.classList.remove("step-enter");

    /*
     * Force a new animation frame so repeated transitions
     * reliably begin from the current presentation state.
     */
    requestAnimationFrame(() => {

        codeStep.classList.add("step-enter");

    });

    codeInput.focus();
}


function showPhoneStep() {

    codeStep.hidden = true;

    phoneStep.hidden = false;

    phoneStep.classList.remove("step-enter");

    requestAnimationFrame(() => {

        phoneStep.classList.add("step-enter");

    });

    phoneInput.focus();
}


/*
 * ============================================================
 * SEND CODE
 * ============================================================
 */

async function sendVerificationCode() {

    if (requestInProgress) {
        return;
    }

    const phone =
        normalizePhone(phoneInput.value);


    if (!phone) {

        setMessage(
            "Enter your phone number.",
            "error"
        );

        phoneInput.focus();

        return;
    }


    const digitCount =
        phone.replace(/\D/g, "").length;


    if (digitCount < 10) {

        setMessage(
            "Enter a valid phone number.",
            "error"
        );

        phoneInput.focus();

        return;
    }


    requestInProgress = true;

    currentPhone = phone;

    sendButton.disabled = true;

    sendButton.innerHTML =
        "<span>Sending…</span>";

    setMessage("");


    try {

        const response = await fetch(
            `${API_BASE_URL}/api/send-code`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "include",

                body: JSON.stringify({
                    phone
                })
            }
        );


        let data = {};

        try {
            data = await response.json();
        } catch {
            data = {};
        }


        if (!response.ok) {

            throw new Error(
                data.error ||
                "We couldn't send the verification code."
            );
        }


        phoneDisplay.textContent =
            maskPhone(phone);


        setMessage(
            "Verification code sent.",
            "success"
        );


        showCodeStep();

    } catch (error) {

        console.error(error);

        setMessage(
            error.message ||
            "Something went wrong. Please try again.",
            "error"
        );

    } finally {

        requestInProgress = false;

        sendButton.disabled = false;

        sendButton.innerHTML = `
            <span>Continue</span>
            <span
                class="button-arrow"
                aria-hidden="true"
            >→</span>
        `;
    }
}


/*
 * ============================================================
 * VERIFY CODE
 * ============================================================
 */

async function verifyVerificationCode() {

    if (requestInProgress) {
        return;
    }


    if (!currentPhone) {

        setMessage(
            "Start a new verification request.",
            "error"
        );

        showPhoneStep();

        return;
    }


    const code =
        codeInput.value
            .replace(/\D/g, "")
            .slice(0, 6);


    codeInput.value = code;


    if (!/^\d{6}$/.test(code)) {

        setMessage(
            "Enter the six-digit verification code.",
            "error"
        );

        codeInput.focus();

        return;
    }


    requestInProgress = true;

    verifyButton.disabled = true;

    verifyButton.innerHTML =
        "<span>Verifying…</span>";

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
                    code
                })
            }
        );


        let data = {};

        try {
            data = await response.json();
        } catch {
            data = {};
        }


        if (
            !response.ok ||
            data.verified !== true
        ) {

            throw new Error(
                data.error ||
                "That verification code is incorrect."
            );
        }


        /*
         * The backend should establish the authenticated
         * session here. The browser does not create its own
         * authentication state.
         */

        setMessage(
            "Identity verified.",
            "success"
        );


        verifyButton.innerHTML =
            "<span>Verified</span>";


        /*
         * A short pause lets the completion state actually
         * register visually. This isn't part of verification
         * itself—the server has already completed it.
         */

        window.setTimeout(() => {

            window.location.assign(
                INTERNAL_SITE_URL
            );

        }, 350);

    } catch (error) {

        console.error(error);

        setMessage(
            error.message ||
            "Verification failed. Please try again.",
            "error"
        );

        verifyButton.disabled = false;

        verifyButton.innerHTML = `
            <span>Verify</span>
            <span
                class="button-arrow"
                aria-hidden="true"
            >→</span>
        `;

    } finally {

        requestInProgress = false;
    }
}


/*
 * ============================================================
 * BACK
 * ============================================================
 */

function useDifferentNumber() {

    currentPhone = "";

    codeInput.value = "";

    setMessage("");

    showPhoneStep();

}


/*
 * ============================================================
 * EVENTS
 * ============================================================
 */

sendButton.addEventListener(
    "click",
    sendVerificationCode
);

verifyButton.addEventListener(
    "click",
    verifyVerificationCode
);

backButton.addEventListener(
    "click",
    useDifferentNumber
);


/*
 * Enter submits the current step.
 */

phoneInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            sendVerificationCode();
        }
    }
);


codeInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            event.preventDefault();

            verifyVerificationCode();
        }
    }
);


/*
 * OTP input should contain digits only.
 */

codeInput.addEventListener(
    "input",
    () => {

        codeInput.value =
            codeInput.value
                .replace(/\D/g, "")
                .slice(0, 6);
    }
);


/*
 * Immediate pointer feedback.
 *
 * :active already handles this in CSS, but Pointer Events
 * make the interaction explicit and work consistently across
 * mouse, touch, and pen input.
 */

for (const button of [
    sendButton,
    verifyButton,
    backButton
]) {

    button.addEventListener(
        "pointerdown",
        () => {

            if (!button.disabled) {
                button.dataset.pressed = "true";
            }
        }
    );


    const release =
        () => {

            delete button.dataset.pressed;
        };


    button.addEventListener(
        "pointerup",
        release
    );

    button.addEventListener(
        "pointercancel",
        release
    );

    button.addEventListener(
        "pointerleave",
        release
    );
}


/*
 * ============================================================
 * INITIAL STATE
 * ============================================================
 */

phoneInput.focus();
