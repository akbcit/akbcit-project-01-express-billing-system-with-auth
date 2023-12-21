"use strict";

/* This script is being used to add lineItems at
client side to an invoice when it is being created */

$(() => {
  // array for lineItems
  let lineItems = [];
  // check if #line-items-list has any input on initial load
  if($("#lineItems-input").val()){
    // unstringify inital value in lineItems input
    let initialLineItems = JSON.parse($("#lineItems-input").val());
    // Add to linitems array
    lineItems = initialLineItems;
    // render rows
    lineItems.forEach((element)=>{
      updateLineItems(element);
    })
  }

  // event listener to add button
  $("#add-new-item").on("click", () => {
    const productId = $("#product-name").val();
    const productName = $("#product-name option:selected").text();
    const qty = parseInt($("#product-qty").val());
    const costStr = $("#product-cost").text();
    const cost = parseFloat(costStr.substring(1));
    let found = false;
    // check if lineItem object with this product already exists
    for (let i = 0; i < lineItems.length; i++) {
      const lineItem = lineItems[i];
      // if product is found update it
      if (lineItem.productId === productId) {
        lineItem.qty = lineItem.qty + qty;
        lineItem.totCost = lineItem.qty * lineItem.unitCost;
        found = true;
        // update the lineitems list
        updateLineItems(lineItem);
        // update hidden input for form
        let jsonString = JSON.stringify(lineItems);
        $("#lineItems-input").val(jsonString);
        break;
      }
    }
    // if not found, create a new object
    if (!found) {
      const lineItem = {
        productId:productId,
        productName: productName,
        qty: qty,
        unitCost: cost,
        totCost: cost * qty,
      };
      // add it to array
      lineItems.push(lineItem);
      // update the line items list
      updateLineItems(lineItem);
      // update hidden input for form
      let jsonString = JSON.stringify(lineItems);
      $("#lineItems-input").val(jsonString);
    }
  });

  // Event listener to remove-btns (using delegation)
  $(document).on("click", ".remove-btn", function (event) {
    // extract id of product from btn
    const productId = event.target.id.split("-")[0];
    // find the product in array and update it
    for (let i = 0; i < lineItems.length; i++) {
      let lineItem = lineItems[i];
      if (lineItem.productId === productId) {
        // update qty and totalcost
        lineItem.qty = lineItem.qty - 1;
        // if new qty is zero remove lineItem
        if (lineItem.qty === 0) {
          lineItems.splice(i, 1);
          // update lineItems list
          updateLineItems(lineItem);
          // update hidden input for form
          let jsonString = JSON.stringify(lineItems);
          $("#lineItems-input").val(jsonString);
          break;
        }
        // otherwise update its totalCost and state on list
        else {
          lineItem.totCost = lineItem.qty * lineItem.unitCost;
          // update lineItems list
          updateLineItems(lineItem);
          // update hidden input for form
          let jsonString = JSON.stringify(lineItems);
          $("#lineItems-input").val(jsonString);
          break;
        }
      }
    }
  });

  // function that updates the line items list
  function updateLineItems(lineItem) {
    const productId = lineItem.productId;
    // get row id associated with lineItem
    const rowId = `${productId}`;
    // if the lineItem does not exist anymore remove this row
    let found = false;
    for (let i = 0; i < lineItems.length; i++) {
      let lineItem = lineItems[i];
      if (lineItem.productId === productId) {
        found = true;
        break;
      }
    }
    // remove row
    if (!found) {
      $(`#${rowId}`).remove();
      return;
    }

    // otherwise update or add row
    const html = `<div id="${rowId}" class="line-items-div"><p>${lineItem.productName} x ${lineItem.qty} $${lineItem.totCost.toFixed(2)}</p><p id="${rowId}-remove" class="remove-btn">&#x2212;</p></div>`;
    // add items to list if it does not exist, update qty if it does
    if ($(`#${rowId}`).length > 0) {
      $(`#${rowId}`).html(html);
    } else {
      // add a new li to ul
      $("#line-items-list").append(
        `<li id=${rowId} class="line-items">${html}</li>`
      );
    }
  }

  // ensure that linitems has at least one item before submitting
  $("#invoice-create-form").on("submit",(event)=>{
    // check value of lineItems input
    let lineItemsInput = $("#lineItems-input").val();
    if(lineItemsInput===""||JSON.parse(lineItemsInput).length===0){
      alert("Please add at least one line item!");
      // don't allow form to be submitted
      event.preventDefault(); 
    }
  })
});
