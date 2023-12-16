"use strict";

$(() => {
  async function typeWriterEffect(text, paraId) {
    const para = $(`#${paraId}`);
    let i = 0;
    // wrapping typewriter effect in a promise
    return new Promise((resolve) => {
      // at every 0.2s call appendChar
      const intervalID = window.setInterval(appendChar, 70);
      // function to append a char to para element
      function appendChar() {
        const char = text.charAt(i);
        para.append(char);
        i++;
        if (i === text.length) {
          window.clearInterval(intervalID);
          resolve();
        }
      }
    });
  }

  const homeText =
    "Streamline your business with Express Billing by Iota – your all-in-one solution for client, product, and invoice management. Register with us to get started!";

  async function main() {
    // display text using typeWriter effect
    await typeWriterEffect(homeText, "home-text");
    // insert register button
    $("#registerBtn-container").append(`<button id="register-btn">Register Now!</button>`)
  }
  main();
});
