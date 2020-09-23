// BUDGET CONTROLLER
var budgetController = (function () {

  var Expense = function(id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
    this.percentage = -1;
  };

  Expense.prototype.calcPercentage = function(totalIncome) {
    if(totalIncome > 0) {
      this.percentage = Math.round((this.value / totalIncome) * 100);
    }
    else {
      this.percentage = -1;
    }
  };

  Expense.prototype.getPercentage = function() {
    return this.percentage;
  }

  var Income = function(id, description, value) {
    this.id = id;
    this.description = description;
    this.value = value;
  };

  var data = {
    allItems: {
      exp: [],
      inc: []
    },
    totals: {
      exp: 0,
      inc: 0
    },
    budget: 0,
    percentage: -1
  };

  var calculateTotal = function(type) {
    var sum = 0;

    data.allItems[type].forEach(function(current) {
      sum += current.value;
    });

    data.totals[type] = sum;
  };

  return {
    addItem: function(type, des, val) {
      var newItem, ID;

      // Create new ID
      if(data.allItems[type].length > 0) {
        ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
      }
      else {
        ID = 0;
      }

      // Create a new item based on 'exp' or 'inc' type
      if(type === 'exp') {
        newItem = new Expense(ID, des, val);
      }
      else if(type === 'inc') {
        newItem = new Income(ID, des, val);
      }

      // Push the new created item into its data structure
      data.allItems[type].push(newItem);

      return newItem;
    },

    deleteItem: function(type, id) {
      var ids, index;

      ids = data.allItems[type].map(function(current) {
        return current.id;
      });

      index = ids.indexOf(id);

      if(index !== -1) {
        data.allItems[type].splice(index, 1);
      }
    },

    calculateBudget: function() {
      // 1. Sum of incomes and sum of expences
      calculateTotal('exp');
      calculateTotal('inc');

      // 2. Calculate the budget: income - expences
      data.budget = data.totals.inc - data.totals.exp;

      // 3. Calculate the % of income that we spend
      if(data.totals.inc > 0) {
        data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
      }
      else {
        data.percentage = -1;
      }
    },

    calculatePercentages: function() {
      data.allItems.exp.forEach(function(current) {
        current.calcPercentage(data.totals.inc);
      });
    },

    getBudget: function() {
      return {
        budget: data.budget,
        totalIncome: data.totals.inc,
        totalExpenses: data.totals.exp,
        percentage: data.percentage
      };
    },

    getPercentages: function() {
      var allPercentages;

      allPercentages = data.allItems.exp.map(function(current) {
        return current.getPercentage();
      });

      return allPercentages;
    },

    testing: function() {
      console.log(data);
    }
  };

})();


// UI CONTROLLER
var UIController = (function() {

  var DOMStrings = {
    inputType: '.add__type',
    inputDescription: '.add__description',
    inputValue: '.add__value',
    inputButton: '.add__btn',
    incomeContainer: '.income__list',
    expenseContainer: '.expenses__list',
    budgetLabel: '.budget__value',
    budgetIncomeLabel: '.budget__income--value',
    budgetExpensesLabel: '.budget__expenses--value',
    budgetExpensesPercentage: '.budget__expenses--percentage',
    container: '.container',
    expensesPercentageLabel: '.item__percentage',
    dateLabel: '.budget__title--month'
  };

  var nodeListForEach = function(list, callback) {
    for(var i = 0; i < list.length; i++) {
      callback(list[i], i);
    }
  };

  var formatNumber = function(num, type) {
    // + or - before the number
    // Exactly 2 decimal places
    // Comma separating the thousands

    var numSplit, int, dec, sign;

    num = Math.abs(num);
    num = num.toFixed(2);

    numSplit = num.split('.');

    int = numSplit[0];
    dec = numSplit[1];

    if(int.length > 3) {
      int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);
    }

    return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
  };

  return {
    getInput: function() {
      return {
        type: document.querySelector(DOMStrings.inputType).value, // inc or exp
        description: document.querySelector(DOMStrings.inputDescription).value,
        value: parseFloat(document.querySelector(DOMStrings.inputValue).value)
      };
    },

    addListItem: function(obj, type) {
      var html, newHtml, element;

      // Create HTML string with placeholder text
      if(type === 'exp') {
        element = DOMStrings.expenseContainer;
        html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
      }
      else if(type === 'inc') {
        element = DOMStrings.incomeContainer;
        html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
      }

      // Replace the placeholder text with actual data
      newHtml = html.replace('%id%', obj.id);
      newHtml = newHtml.replace('%description%', obj.description);
      newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

      // Insert the HTML into the DOM
      document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
    },

    deleteListItem: function(divID) {
      var element;

      element = document.querySelector('#' + divID);
      element.parentNode.removeChild(element);
    },

    clearFields: function() {
      var fields, fieldsArray;

      fields = document.querySelectorAll(DOMStrings.inputDescription + ', ' + DOMStrings.inputValue); // Returns a list

      // Convert the list to an array
      fieldsArray = Array.prototype.slice.call(fields);

      fieldsArray.forEach(function(current) {
        current.value = '';
      });

      fieldsArray[0].focus();
    },

    displayBudget: function(obj) {
      var type;

      obj.budget > 0 ? type = 'inc' : type = 'exp';

      document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(obj.budget, type);
      document.querySelector(DOMStrings.budgetIncomeLabel).textContent = formatNumber(obj.totalIncome, 'inc');
      document.querySelector(DOMStrings.budgetExpensesLabel).textContent = formatNumber(obj.totalExpenses, 'exp');
      if(obj.percentage > 0) {
        document.querySelector(DOMStrings.budgetExpensesPercentage).textContent = obj.percentage + '%';
      }
      else {
        document.querySelector(DOMStrings.budgetExpensesPercentage).textContent = '--';
      }
    },

    displayPercentages: function(percentages) {
      var fields;

      fields = document.querySelectorAll(DOMStrings.expensesPercentageLabel); // Returns node(element) list

      nodeListForEach(fields, function(current, index) {
        if(percentages[index] > 0) {
          current.textContent = percentages[index] + '%';
        }
        else {
          current.textContent = '--';
        }
      });
    },

    displayDate: function() {
      var now, months, month, year;

      now = new Date();

      months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      month = now.getMonth();
      year = now.getFullYear();
      document.querySelector(DOMStrings.dateLabel).textContent = months[month] + ', ' + year;
    },

    changedType: function() {
      var fields = document.querySelectorAll(DOMStrings.inputType + ',' + DOMStrings.inputDescription + ',' + DOMStrings.inputValue);

      nodeListForEach(fields, function(current) {
        current.classList.toggle('red-focus');
      });

      document.querySelector(DOMStrings.inputButton).classList.toggle('red');
    },

    getDOMStrings: function() {
      return DOMStrings;
    }
  };

})();


// GLOBAL APP CONTROLLER
var controller = (function (budgetCtrl, UICtrl) {

  var setEventListeners = function() {
    var DOM = UICtrl.getDOMStrings(); // Get DOM strings object from the UI Controller

    document.querySelector(DOM.inputButton).addEventListener('click', ctrlAddItem);

    window.addEventListener('keypress', (e) => {
      if(e.keyCode === 13 || e.which === 13) {
        ctrlAddItem();
      }
    });

    document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

    document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
  };

  var ctrlAddItem = function() {
    var input, newItem;

    // 1. Get the input field data
    input = UICtrl.getInput();

    if(input.description && input.value && input.value > 0) {
      // 2. Add the item to the budget controller
      newItem = budgetCtrl.addItem(input.type, input.description, input.value);

      // 3. Add the item to the UI controller
      UICtrl.addListItem(newItem, input.type);

      // 4. Clear input fields
      UICtrl.clearFields();

      // 5. Calculate and update budget
      updateBudget();

      // 6. Calculate and update percentages
      updatePercentages();
    }
  };

  var ctrlDeleteItem = function(e) {
    var itemID, splitID, type, ID;

    itemID = e.target.parentNode.parentNode.parentNode.parentNode.id;

    if(itemID) {
      // inc-1: we will split this
      splitID = itemID.split('-');
      type = splitID[0];
      ID = parseInt(splitID[1]);

      // 1. Delete the item from the data structure
      budgetCtrl.deleteItem(type, ID);

      // 2. Delete the item from the UI
      UICtrl.deleteListItem(itemID);

      // 3. Update and show the new budget
      updateBudget();

      // 4. Calculate and update percentages
      updatePercentages();
    }
  };

  var updateBudget = function() {
    var budget;

    // 1. Calculate the budget
    budgetCtrl.calculateBudget();

    // 2. Return the budget
    budget = budgetCtrl.getBudget();

    // 3. Display the budget
    UICtrl.displayBudget(budget);
  };

  var updatePercentages = function() {
    var percentages;
    // 1. Calculate percentages
    budgetCtrl.calculatePercentages();

    // 2. Read percentages from the budget controller
    percentages = budgetCtrl.getPercentages();

    // 3. Update the UI with the new percentages
    UICtrl.displayPercentages(percentages);
  };

  return {
    init: function() {
      UICtrl.displayBudget({
        budget: 0,
        totalIncome: 0,
        totalExpenses: 0,
        percentage: -1
      });
      UICtrl.displayDate();
      setEventListeners();
    }
  };

})(budgetController, UIController);


controller.init();

