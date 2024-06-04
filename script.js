document.addEventListener("DOMContentLoaded", function() {
  loadLodges();
  setMinDates();
  addCustomerDetailsValidation();
});

let activeLodge = null;
let selectedCapacity = 0;

function setMinDates() {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const checkInInput = document.getElementById("checkIn");
  const checkOutInput = document.getElementById("checkOut");

  checkInInput.setAttribute("min", todayStr);
  checkInInput.value = todayStr;

  checkOutInput.setAttribute("min", tomorrowStr);
  checkOutInput.value = tomorrowStr;
}

function loadLodges() {
  fetch('lodges.xml')
    .then(response => response.text())
    .then(data => {
      let parser = new DOMParser();
      let xml = parser.parseFromString(data, "application/xml");
      let lodges = xml.getElementsByTagName("lodge");

      for (let lodge of lodges) {
        let id = lodge.getAttribute("id");
        let lodgeDiv = document.getElementById(`lodge${id}`);
        let name = lodge.getElementsByTagName("name")[0].textContent;
        let capacity = lodge.getElementsByTagName("capacity")[0].textContent;
        let cost = lodge.getElementsByTagName("cost_per_day")[0].textContent;
        let description = lodge.getElementsByTagName("description")[0].textContent;
        let image = lodge.getElementsByTagName("image")[0].textContent;
        let booked = lodge.getElementsByTagName("booked")[0].textContent === "true";

        lodgeDiv.addEventListener("mouseover", function() {
          if (activeLodge !== lodgeDiv) {
            showLodgeInfo(name, description, image, capacity, cost, booked, lodgeDiv);
          }
        });

        lodgeDiv.addEventListener("mouseout", function() {
          if (activeLodge !== lodgeDiv) {
            hideLodgeInfo();
          }
        });

        lodgeDiv.addEventListener("click", function() {
          if (activeLodge === lodgeDiv) {
            hideLodgeInfo();
            activeLodge = null;
          } else {
            activeLodge = lodgeDiv;
            showLodgeInfo(name, description, image, capacity, cost, booked, lodgeDiv);
          }
        });

        lodgeDiv.dataset.capacity = capacity;
        lodgeDiv.dataset.booked = booked;
      }
    })
    .catch(error => {
      console.error('Error fetching lodges:', error);
      alert("An error occurred while fetching lodges. Please try again.");
    });
}

function showLodgeInfo(name, description, image, capacity, cost, booked, lodgeDiv) {
  let lodgeInfo = document.getElementById("lodgeInfo");
  document.getElementById("lodgeName").textContent = name;
  document.getElementById("lodgeDescription").textContent = description;
  document.getElementById("lodgeImage").src = image;
  document.getElementById("lodgeCapacity").textContent = `Capacity: ${capacity}`;
  document.getElementById("lodgeCost").textContent = `Cost per day: $${cost}`;
  document.getElementById("lodgeBooked").textContent = `Booked: ${booked ? 'Yes' : 'No'}`;

  let bookNowButton = document.querySelector("#lodgeInfo button");
  if (parseInt(capacity) < selectedCapacity || booked) {
    bookNowButton.disabled = true;
    bookNowButton.style.backgroundColor = 'gray';
  } else {
    bookNowButton.disabled = false;
    bookNowButton.style.backgroundColor = '#007bff';
  }

  lodgeInfo.style.display = "block";
  lodgeInfo.style.top = lodgeDiv.offsetTop + lodgeDiv.offsetHeight + "px";
  lodgeInfo.style.left = lodgeDiv.offsetLeft + "px";
}

function hideLodgeInfo() {
  document.getElementById("lodgeInfo").style.display = "none";
}

function showCustomerDetails() {
  if (document.querySelector("#lodgeInfo button").disabled) {
    alert("This lodge cannot accommodate your party size or is already booked.");
  } else {
    showPage('customerDetailsPage');
  }
}

function goBack() {
  showPage('bookingPage');
}

function showBookingConfirmation() {
  document.getElementById("confirmCheckIn").value = document.getElementById("checkIn").value;
  document.getElementById("confirmCheckOut").value = document.getElementById("checkOut").value;
  document.getElementById("confirmGuests").value = document.getElementById("capacity").value;
  document.getElementById("confirmLodge").value = document.getElementById("lodgeName").textContent;

  showPage('bookingConfirmationPage');
}

function goToCustomerDetails() {
  showPage('customerDetailsPage');
}

function searchLodges() {
  let checkIn = document.getElementById("checkIn").value;
  let checkOut = document.getElementById("checkOut").value;
  selectedCapacity = parseInt(document.getElementById("capacity").value);

  if (checkIn && checkOut && selectedCapacity) {
    filterLodges(checkIn, checkOut, selectedCapacity);
  } else {
    alert("Please fill out all fields correctly.");
  }
}

function filterLodges(checkIn, checkOut, capacity) {
  fetch('lodges.xml')
    .then(response => response.text())
    .then(data => {
      let parser = new DOMParser();
      let xml = parser.parseFromString(data, "application/xml");
      let lodges = xml.getElementsByTagName("lodge");
      let lodgesAvailable = false;

      for (let lodge of lodges) {
        let id = lodge.getAttribute("id");
        let booked = lodge.getElementsByTagName("booked")[0].textContent === "true";
        let lodgeCapacity = parseInt(lodge.getElementsByTagName("capacity")[0].textContent);
        let lodgeDiv = document.getElementById(`lodge${id}`);

        if (!booked && lodgeCapacity >= capacity) {
          lodgeDiv.style.backgroundColor = "rgba(0, 255, 0, 0.5)";
          lodgeDiv.dataset.booked = "false";
          lodgesAvailable = true;
        } else {
          lodgeDiv.style.backgroundColor = "rgba(255, 0, 0, 0.5)";
          lodgeDiv.dataset.booked = "true";
        }

        lodgeDiv.dataset.capacity = lodgeCapacity;
        lodgeDiv.dataset.booked = booked;
      }

      if (!lodgesAvailable) {
        alert("No lodges available for the selected dates and capacity.");
      }
    })
    .catch(error => {
      console.error('Error fetching lodges:', error);
      alert("An error occurred while fetching lodges. Please try again.");
    });
}

function submitDetails() {
  let fullName = document.getElementById("fullName").value;
  let mobile = document.getElementById("mobile").value;
  let email = document.getElementById("email").value;
  let confirmEmail = document.getElementById("confirmEmail").value;

  if (!fullName) {
    return false;
  }

  if (!mobile.match(/^\d{10}$/)) {
    return false;
  }

  if (!email) {
    return false;
  }

  if (email !== confirmEmail) {
    return false;
  }

  return true;
}

function addCustomerDetailsValidation() {
  const inputs = document.querySelectorAll("#customerDetailsPage input");
  const nextButton = document.querySelector("#customerDetailsPage button");

  function validateForm() {
    nextButton.disabled = !submitDetails();
  }

  inputs.forEach(input => {
    input.addEventListener("input", validateForm);
  });

  // Initial validation check in case form is pre-filled
  validateForm();
}

function proceedToPayment() {
  showPage('paymentConfirmationPage');
}

function goToBookingConfirmation() {
  showPage('bookingConfirmationPage');
}

function showBookingSummary() {
  document.getElementById("summaryName").value = document.getElementById("fullName").value;
  document.getElementById("summaryCheckIn").value = document.getElementById("confirmCheckIn").value;
  document.getElementById("summaryCheckOut").value = document.getElementById("confirmCheckOut").value;
  document.getElementById("summaryGuests").value = document.getElementById("confirmGuests").value;
  document.getElementById("summaryLodge").value = document.getElementById("confirmLodge").value;
  document.getElementById("summaryTotal").value = calculateTotal();

  showPage('bookingSummaryPage');
}

function calculateTotal() {
  let checkInDate = new Date(document.getElementById("confirmCheckIn").value);
  let checkOutDate = new Date(document.getElementById("confirmCheckOut").value);
  let costPerDay = 100; // Replace with actual cost per day
  let numberOfDays = (checkOutDate - checkInDate) / (1000 * 3600 * 24);
  return numberOfDays * costPerDay;
}

function showPage(pageId) {
  let pages = document.querySelectorAll('.page');
  pages.forEach(page => {
    if (page.id === pageId) {
      page.classList.add('active');
    } else {
      page.classList.remove('active');
    }
  });
}
