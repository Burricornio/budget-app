
// Declaramos tres modulos. Cada módulo tiene su parte privada y pública: (El return - Gracias a los closures)
// BUDGET CONTROLLER
var budgetController = (function () {

    // Modelo de gasto -- Privado
    var Expense = function (id, description, value) {
      this.id = id;
      this.description = description;
      this.value = value;
      this.percentage = -1;
    };

    // Calcula el porcentage basandose en el ototal del presupuesto.
    Expense.prototype.calcPercentage = function (totalIncome) {

      if (totalIncome > 0) {
        this.percentage = Math.round((this.value / totalIncome) * 100);
      } else {
        this.percentage = -1;
      }

    };

    // Función para poder leer el porcentaje
    Expense.prototype.getPercentage = function () {
      return this.percentage;
    };

    // Modelo de ingreso -- Privado
    var Income = function (id, description, value) {
      this.id = id;
      this.description = description;
      this.value = value;
    };

    // Calcular los totales. La llamamos dentro de la función 'calculateBudget'
    var calculateTotal = function (type) {

      // Suma total
      var sum = 0;

      // Recorremos el array respectivo
      data.allItems[type].forEach(function (item, index) {
        sum += item.value;
      });

      // Guarda el total dentro del objeto data
      data.totals[type] = sum;
    };

    // Objeto para almacenar los datos
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

    // Parte pública
    return {
      addItem: function (type, desc, val) {
        var newItem, ID;

        // Crea un nuevo ID
        if (data.allItems[type].length > 0) {
          ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
        } else {
          ID = 0;
        }


        // Comprueba si es un gasto o un ingreso y crea un nuevo elemento
        if (type === 'exp') {
          newItem = new Expense(ID, desc, val);
        } else if (type === 'inc') {
          newItem = new Income(ID, desc, val);
        }

        // Incluimos el nevo item en el objeto de datos
        data.allItems[type].push(newItem);

        // Retorna el nuevo elemento
        return newItem;

      },

      // Elimina un item d ela lista
      deleteItem (type, id) {
        var ids, index;

          // La diferencia entre map y foreach es que map devuelve un nuevo array
          ids = data.allItems[type].map(function(current) {
            return current.id
          })

          // Buscamos el indice del elemnto dentro del array
          index = ids.indexOf(id);

          // Eliminamos el elemento
          if (index !== -1) {
            data.allItems[type].splice(index, 1);
          }
      },

      // Calcula los totales y el presupuesto total
      calculateBudget: function () {

          // Calcula los ingresos totales y los gastos
          calculateTotal('exp');
          calculateTotal('inc');

          // Calcula el presupuesto: ingresos - gastos
          data.budget = data.totals.inc - data.totals.exp;

          // Calcula el porcentage de ingreso que necesitamos
          // Comprueba que haya ingresos para que no de un porcentage 'infinito'
          if (data.totals.inc > 0) {
            data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
          } else {
            data.percentage = -1;
          }

      },

      // Calcula los porcentajes
      calculatePercentages: function () {

        // Se diferencia de ForEach en que retorna y almacena cada item en un nuevo array
        data.allItems.exp.forEach(function(current) {
          current.calcPercentage(data.totals.inc);
        });
      },

      // Obtenemos los porcentajes
      getPercentages: function () {
        var allPerc = data.allItems.exp.map((function(current) {
          return current.getPercentage();
        }));

        return allPerc;

      },

      // Simplemente retorna el presupuesto
      getBudget: function () {
        return {
          budget: data.budget,
          totalInc: data.totals.inc,
          totalExp: data.totals.exp,
          percentage: data.percentage
        }
      },

      // metodo para comporbar el resultado
      testing: function () {
        console.log(data);
      }
    }

})();

// UI CONTROLLER
var UIController = (function() {

  // Parte privada (Todo lo que no esté dentro del return)
  var DOMstrings = {
    inputType: '.add__type',
    inputDescription: '.add__description',
    inputValue: '.add__value',
    inputBtn: '.add__btn',
    incomeContainer: '.income__list',
    expensesContainer: '.expenses__list',
    budgetLabel: '.budget__value',
    incomeLabel: '.budget__income--value',
    expenseLabel: '.budget__expenses--value',
    percentageLabel: '.budget__expenses--percentage',
    container: '.container',
    expensesPercentageLabel: '.item__percentage',
    dateLabel: '.budget__title--month'
  };

  // Formatear los números (Solo utilizamos la función en este módulo, así que no necesitamos que sea público)
  var formatNumber = function (number, type) {
    var numberSplit, int, dec;

    /* REGLAS
    - 1. + o - antes del número
    - 2. Dos decimales
    - 3. Coma antes de los decimales
    2310.4567 -> + 2.310,45
    2000 -> + 2.000,00
    */

    // Nos quedamos con la parte absoluta
    number = Math.abs(number);

    // Decimales
    number = number.toFixed(2);

    // Separador coma
    numberSplit = number.split('.')

    int = numberSplit[0];

    if (int.length > 3) {
      int = int.substr(0, int.length - 3) + '.' + int.substr(int.length - 3, 3); // input 2310 -> 2,310
    }

    dec = numberSplit[1];

    return (type === 'exp' ? '-' : '+') + ' ' + int + ',' + dec;

  };

  // Crea nuestra propia función para convertir la nodeList en un Array - REUTILIZABLE EN OTRAS APPS
  var nodeListForEach = function (list, callback) {
    for (var i = 0; i < list.length; i++) {
      callback(list[i], i);
    }
  };

  // Parte pública
  return {
    getInput: function () {

      return {
        type: document.querySelector(DOMstrings.inputType).value, // Será inc o exp
        description: document.querySelector(DOMstrings.inputDescription).value,
        value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
      };

    },

    addListItem: function (obj, type) {
      var html, newHtml, element;

      // Creamos una etiqueta HTML con un texto placeholder
      if (type === 'inc') {
        element = DOMstrings.incomeContainer;
        html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
      } else if(type === 'exp') {
        element = DOMstrings.expensesContainer;
        html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
      }

      // Reemplaza el placeholder con el dato
      newHtml = html.replace('%id%', obj.id);
      newHtml = newHtml.replace('%description%', obj.description);
      newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

      // Inserta el HTML en el DOM
      document.querySelector(element).insertAdjacentHTML('beforeend', newHtml)
    },

    // Elimina el elemnto de la UI
    deleteListItem: function (selectorID) {

      // Hay que seleccionar al padre porue solo se pueden eliminar hijos
      var el = document.getElementById(selectorID);
      el.parentNode.removeChild(el);

    },

    // Metodo público para borrar campos inputs
    clearFields: function () {
      var fields, fieldsArray;

      fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);

      // Truco para convertir la nodeList en un array. Le pedimos prestado al objeto array la función slice mediante 'call'
      fieldsArray = Array.prototype.slice.call(fields);

      // Itermaos el array para resetear el valor de los input a vacio
      fieldsArray.forEach(function (field, index,) {
        field.value = '';
      });

      // Establece el foco en el primer input
      fieldsArray[0].focus();
    },

    // Pinta ne pantalla el presupuesto y los totales
    displayBudget: function (obj) {
      var type;

      obj.budget > 0 ? type = 'inc' : type = 'exp';

      document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
      document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
      document.querySelector(DOMstrings.expenseLabel).textContent = formatNumber(obj.totalExp, 'exp');

      if (obj.percentage > 0) {
        document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
      } else {
        document.querySelector(DOMstrings.percentageLabel).textContent = '---';
      }

    },

    // Mostrar porcentajes en la UI
    displayPercentages: function (percentages) {

      // Devuelve una nodeList
      var fields = document.querySelectorAll(DOMstrings.expensesPercentageLabel);


      // Convertimos la nodeList en un array
      nodeListForEach(fields, function(current, index) {

        if (percentages[index] > 0) {
          current.textContent = percentages[index] + '%';
        } else {
          current.textContent = '---';
        }

      })
    },

    // Muestra el mes actual
    displayDate: function () {
      var now, year, month, months;

      // Obtiene fecha actual --- Ejemplo con fecha concreta -> var christmas = new Date(2018, 11, 25);
      now = new Date();

      // Obtenemos año y mes
      year = now.getFullYear();
      months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
      month = now.getMonth();

      // Selector del nodo donde incluimos la fecha
      document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
    },

    // Cambia el color del outline de los elemntos agregando o eliminando clases
    changedType: function () {
      var fields;

      fields = document.querySelectorAll(
        DOMstrings.inputType + ',' +
        DOMstrings.inputDescription + ',' +
        DOMstrings.inputValue
      );

      nodeListForEach(fields, function (current) {
        current.classList.toggle('red-focus');
      })

      document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
    },

    // Retorna el objeto que utilizamos para referirnos a los elementos del DOM mediante sus clases
    getDOMstrings: function () {
      return DOMstrings;
    }
  }

})();


// GLOBAL APP CONTROLLER
// Este modulo recibe los otros dos como parámetros
var controller = (function (budgetCtrl, UICtrl) {

  var setupEventListeners = function () {

    var DOM = UICtrl.getDOMstrings();

    document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

    document.addEventListener('keypress', function (event) {

      // Si pulsamos la tecla enter
      if (event.keyCode === 13 || event.which === 13) {
        ctrlAddItem();
      }
    });

    // Técnica event delegation para eliminar los items --- añadimos el manejador al padre
    document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

    // Evento para cambiar el color del borde en función de si estamos incluyendo un ingreso o un gasto
    document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);

  }

  var updateBudget = function () {

    // Calculamos el presupuesto
    budgetCtrl.calculateBudget();

    // retorna el presupuesto
    var budget = budgetCtrl.getBudget();

    // Mostrar el presupuesto  en la UI
    UICtrl.displayBudget(budget);

  };

  // Actualiza los porcentages
  var updatePercentages = function () {

      // 1. Calcula los porcentajes
      budgetCtrl.calculatePercentages();

      // 2. Lee y almacena los porcentajes del el budgetController
      var percentages = budgetCtrl.getPercentages();

      // 3. Actualiza la UI con los nuevos porcentajes
      UICtrl.displayPercentages(percentages)

  }

  var ctrlAddItem = function () {
    var input, newItem;

    // 1. Obtenemos el valor del input
    input = UICtrl.getInput();


    // Controlamos que los campos no esten vacios
    if (input.description !== '' && !isNaN(input.value) && input.value > 0) {

      // 2. Añadimos el item al budget controller
      newItem = budgetCtrl.addItem(input.type, input.description, input.value)

      // 3. Añadimos el nuevo item a la UI
      UICtrl.addListItem(newItem, input.type);

      // 4. Elmina los valores de los inputs
      UICtrl.clearFields();

      // 5. Calcula y actualiza el presupuesto
      updateBudget();

      // 6. Calcula y actualiza los porcentajes
      updatePercentages();

    } else {
      console.log('Empty fields');
    }

  };

  // Elimina los items
  var ctrlDeleteItem = function (event) {
    var itemID, spliID, type, id, DOM;


    // Técnica traversing DOM
    itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

    // Si el elemento  padre * 4 del elemento tiene id
    if (itemID) {

      // inc-1
      splitID = itemID.split('-');
      type = splitID[0];
      id = parseInt(splitID[1]);

      // 1. Eliminamos el item de la estructura de datos
      budgetCtrl.deleteItem(type, id);

      // 2. Elimina el item de la UI
      UICtrl.deleteListItem(itemID);

      // 3. Actualiza y muestra el presupuesto
      updateBudget();

      // 4. Calcula y actualiza los porcentajes
      updatePercentages();

    }
  }

  return {
    // Función para inicializar la aplicación
    init: function () {
      console.log('Application has started.');

      // Iniciamos los valores de los totales a 0
      UICtrl.displayBudget({
        budget: 0,
        totalInc: 0,
        totalExp: 0,
        percentage: -1
      });

      // Inicializa la fecha actual
      UICtrl.displayDate();

      // Inicializamo los listeners
      setupEventListeners();
    }
  }

})(budgetController, UIController);


// Inicializamos la app
controller.init();