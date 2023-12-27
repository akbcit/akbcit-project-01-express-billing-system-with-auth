"use strict";

/* This script is being used to allow self edit of user name */

$(() => {
  const fieldReferences = {
    username: {
      view: "username-view",
      edit: "username-edit",
    },
    email: {
      view: "email-view",
      edit: "email-edit",
    },
    firstName: {
      view: "firstName-view",
      edit: "firstName-edit",
    },
    lastName: {
      view: "lastName-view",
      edit: "lastName-edit",
    },
  };
  const selfEditBtn = $("#self-edit-btn");
  // event listener for self edit links
  $(".self-edit-link").on("click", (event) => {
    // get field name corresponding to edit link clicked
    const field = event.target.id.split("-")[2];
    // get references to view and edit elements
    const viewlele = $(`#${fieldReferences[field].view}`);
    const editele = $(`#${fieldReferences[field].edit}`);
    // hide view ele
    viewlele.css({"display":"none"});
    // display editele
    editele.css({"display":"inline"});
    // display form submit button
    selfEditBtn.css({"display":"inline"});
  });
});
