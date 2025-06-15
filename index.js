// script.js

// Referencias a elementos del DOM
// const csvFile = document.getElementById('csvFile'); // Eliminado: el input de archivo CSV ya no existe
const chartBody = document.getElementById('chartBody');
const exportXlsxButton = document.getElementById('exportXlsx'); // Botón de exportar XLSX
const clearDataButton = document.getElementById('clearData');
const messageBox = document.getElementById('messageBox');
const mainTitle = document.getElementById('mainTitle'); // Elemento H1 para el título principal

// Elementos para la entrada manual de datos
const itemNameInput = document.getElementById('itemNameInput');
const itemRatingInput = document.getElementById('itemRatingInput');
const itemDateInput = document.getElementById('itemDateInput'); // Input de fecha
const addItemButton = document.getElementById('addItemButton');

let chartData = []; // Array para almacenar los objetos de los elementos: [{ name: 'Item A', rating: 3.5, date: 'YYYY-MM-DD' }]

/**
 * Muestra una notificación temporal en un cuadro de mensaje.
 * @param {string} message - El mensaje a mostrar.
 * @param {string} type - El tipo de mensaje (ej. 'success', 'error', 'info', 'warning'). Afecta el color de fondo.
 */
function showMessage(message, type = 'success') {
    messageBox.textContent = message;
    // Aplicar estilos directamente
    messageBox.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
        font-weight: bold;
        color: white;
    `;
    if (type === 'success') {
        messageBox.style.backgroundColor = '#4CAF50'; // Verde para éxito
    } else if (type === 'error') {
        messageBox.style.backgroundColor = '#f44336'; // Rojo para error
    } else if (type === 'warning') {
        messageBox.style.backgroundColor = '#ff9800'; // Naranja para advertencia
    }
    else {
        messageBox.style.backgroundColor = '#2196F3'; // Azul para información
    }
    messageBox.style.opacity = '1';

    // Ocultar después de 3 segundos
    setTimeout(() => {
        messageBox.style.opacity = '0';
    }, 3000);
}

/**
 * Ordena los datos de la tabla por calificación (descendente) y luego por fecha (ascendente).
 */
function sortChartData() {
    chartData.sort((a, b) => {
        // Ordenamiento primario: calificación en orden descendente (más alta primero)
        if (b.rating !== a.rating) {
            return b.rating - a.rating; // Orden descendente para la calificación
        }
        // Ordenamiento secundario: fecha en orden ascendente (más antigua primero)
        // Usar 0 para fechas inválidas para empujarlas al principio si no es una cadena de fecha válida
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB; // Orden ascendente para la fecha
    });
}

/**
 * Renderiza los datos de la tabla en la interfaz HTML.
 */
function renderChart() {
    chartBody.innerHTML = ''; // Limpiar filas existentes
    if (chartData.length === 0) {
        chartBody.innerHTML = '<tr><td colspan="4">No hay datos para mostrar. Agrega un elemento manualmente o importa un archivo XLSX.</td></tr>'; // Mensaje actualizado
        return;
    }

    sortChartData(); // Ordenar los datos antes de renderizar

    chartData.forEach((item, index) => {
        const row = document.createElement('tr');
        // Sin clases para el estilo de la fila
        // Formatear fecha para mostrar
        const displayDate = item.date ? new Date(item.date).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A';

        row.innerHTML = `
            <td>${item.name}</td>
            <td>
                <input type="number" step="0.5" min="0" max="5" value="${item.rating}" data-index="${index}">
                <button data-action="increment" data-index="${index}">+</button>
                <button data-action="decrement" data-index="${index}">-</button>
            </td>
            <td>${displayDate}</td>
            <td>
                <button data-action="delete" data-index="${index}">Eliminar</button>
            </td>
        `;
        chartBody.appendChild(row);
    });

    // Añadir escuchadores de eventos para los inputs de calificación y botones
    chartBody.querySelectorAll('input[type="number"]').forEach(input => { // Dirigido por tipo ahora
        input.addEventListener('change', handleRatingChange);
    });
    chartBody.querySelectorAll('button').forEach(button => { // Dirigido por tipo ahora
        button.addEventListener('click', handleRatingButtonClick);
    });
}

/**
 * Guarda los datos actuales de la tabla en el almacenamiento local.
 */
function saveChartData() {
    localStorage.setItem('customChartData', JSON.stringify(chartData));
}

/**
 * Carga los datos de la tabla desde el almacenamiento local al cargar la página.
 */
function loadChartData() {
    const storedData = localStorage.getItem('customChartData');
    if (storedData) {
        chartData = JSON.parse(storedData);
        // Asegurarse de que los datos antiguos sin fechas obtengan una fecha predeterminada para el ordenamiento
        chartData.forEach(item => {
            if (!item.date) {
                item.date = new Date().toISOString().split('T')[0]; // Predeterminado a la fecha actual
            }
        });
        renderChart();
        showMessage('Back to the point...', 'info');
    } else {
        renderChart(); // Renderizar tabla vacía si no hay datos
    }

    // Cargar y establecer el título desde el almacenamiento local
    const storedTitle = localStorage.getItem('chartTitle');
    if (storedTitle) {
        mainTitle.textContent = storedTitle;
    } else {
        // Establecer marcador de posición si está vacío
        mainTitle.textContent = mainTitle.dataset.placeholder;
        mainTitle.style.color = '#a0a0a0'; // Color del marcador de posición
        mainTitle.style.fontStyle = 'italic'; // Estilo del marcador de posición
    }
}

/**
 * Handles XLSX file import using SheetJS.
 * @param {Event} event - The file input change event.
 */
xlsxFile.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            // Convert sheet to JSON, assuming first row is header
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (json.length < 2) { // Need at least header and one data row
                showMessage('El archivo XLSX está vacío o no contiene datos válidos.', 'error');
                return;
            }

            const headers = json[0];
            const nameColIndex = headers.findIndex(h => h.trim().toLowerCase() === 'name');
            const ratingColIndex = headers.findIndex(h => h.trim().toLowerCase() === 'rating');
            const dateColIndex = headers.findIndex(h => h.trim().toLowerCase() === 'date');

            if (nameColIndex === -1 || ratingColIndex === -1 || dateColIndex === -1) {
                showMessage('"Name", Rating" and "Date" are obligatory.', 'error');
                return;
            }

            const newData = [];
            let hasParseError = false;

            json.slice(1).forEach((row, rowIndex) => { // Skip header row
                const name = row[nameColIndex] ? String(row[nameColIndex]).trim() : '';
                let rating = parseFloat(row[ratingColIndex]);
                let date = row[dateColIndex];

                if (name === '') {
                    showMessage(`Advertencia: Fila ${rowIndex + 2}: El nombre del elemento está vacío y la fila será omitida.`, 'warning');
                    hasParseError = true;
                    return; // Skip this row
                }

                if (isNaN(rating) || rating < 0 || rating > 5) {
                    rating = 0; // Default to 0 if invalid
                    showMessage(`Advertencia: Fila ${rowIndex + 2}: La calificación para "${name}" no es válida y se estableció en 0.`, 'warning');
                    hasParseError = true;
                }

                // Convert XLSX date number to YYYY-MM-DD string if it's a number
                if (typeof date === 'number') {
                    date = new Date(Math.round((date - (25567 + 1)) * 86400 * 1000)).toISOString().split('T')[0];
                } else if (typeof date === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                    date = new Date().toISOString().split('T')[0]; // Default to current date if string is not YYYY-MM-DD
                    showMessage(`Advertencia: Fila ${rowIndex + 2}: La fecha para "${name}" no es válida y se estableció en la fecha actual.`, 'warning');
                    hasParseError = true;
                } else if (!date) { // If date is null/undefined/empty
                    date = new Date().toISOString().split('T')[0]; // Default to current date
                    showMessage(`Advertencia: Fila ${rowIndex + 2}: No se proporcionó fecha para "${name}", se usó la fecha actual.`, 'info');
                }


                newData.push({ name: name, rating: rating, date: date });
            });

            chartData = newData; // Replace old data with new
            saveChartData();
            renderChart();
            if (!hasParseError) {
                showMessage('Archivo XLSX importado exitosamente!', 'success');
            } else {
                showMessage('Archivo XLSX importado con algunas advertencias.', 'warning');
            }

        } catch (error) {
            showMessage(`Error al procesar el archivo XLSX: ${error.message}`, 'error');
            console.error(error);
        }
    };
    reader.readAsArrayBuffer(file);
});

/**
 * Maneja los cambios en el campo de entrada de calificación.
 * @param {Event} event - El evento de cambio del input.
 */
function handleRatingChange(event) {
    const index = event.target.dataset.index;
    let newRating = parseFloat(event.target.value);

    if (isNaN(newRating) || newRating < 0) {
        newRating = 0; // Predeterminado a 0 si es inválido
        showMessage('La calificación no es válida y se ha establecido en 0.', 'warning');
    } else if (newRating > 5) {
        newRating = 5; // Limitar a 5
        showMessage('La calificación no puede exceder 5 y se ha establecido en 5.', 'warning');
    }

    chartData[index].rating = newRating;
    saveChartData();
    // Volver a renderizar para actualizar el valor mostrado si se limitó y para reordenar
    renderChart();
    showMessage('Calificación actualizada.', 'success');
}

/**
 * Maneja los clics en los botones de incrementar, decrementar y eliminar.
 * @param {Event} event - El evento de clic del botón.
 */
function handleRatingButtonClick(event) {
    const action = event.target.dataset.action;
    const index = parseInt(event.target.dataset.index);

    if (action === 'increment') {
        if (chartData[index].rating < 5) {
            chartData[index].rating = Math.min(5, chartData[index].rating + 0.5);
            saveChartData();
            renderChart();
            showMessage('Calificación incrementada.', 'success');
        }
    } else if (action === 'decrement') {
        if (chartData[index].rating > 0) {
            chartData[index].rating = Math.max(0, chartData[index].rating - 0.5);
            saveChartData();
            renderChart();
            showMessage('Calificación decrementada.', 'success');
        }
    } else if (action === 'delete') {
        chartData.splice(index, 1); // Eliminar elemento del array
        saveChartData();
        renderChart();
        showMessage('Elemento eliminado.', 'success');
    }
}

/**
 * Maneja la adición de un nuevo elemento manualmente.
 */
addItemButton.addEventListener('click', () => {
    const name = itemNameInput.value.trim();
    let rating = parseFloat(itemRatingInput.value);
    let date = itemDateInput.value; // Obtener fecha del input

    if (name === '') {
        showMessage('El nombre del elemento no puede estar vacío.', 'error');
        return;
    }

    if (isNaN(rating) || rating < 0 || rating > 5) {
        showMessage('La calificación debe ser un número entre 0 y 5.', 'error');
        return;
    }

    // Si no se proporciona fecha, se establece por defecto a la fecha actual
    if (date === '') {
        date = new Date().toISOString().split('T')[0];
        showMessage('No se proporcionó fecha, se usó la fecha actual.', 'info');
    }

    chartData.push({ name: name, rating: rating, date: date });
    saveChartData();
    renderChart();
    showMessage('That is new.', 'success');

    // Limpiar inputs
    itemNameInput.value = '';
    itemRatingInput.value = '';
    itemDateInput.value = ''; // Limpiar input de fecha
});

/**
 * Exports the current chart data to an XLSX file using SheetJS.
 */
exportXlsxButton.addEventListener('click', () => {
    if (chartData.length === 0) {
        showMessage('No hay datos para exportar.', 'warning');
        return;
    }

    // Create a new workbook and add a worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(chartData);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Calificaciones');

    // Write the workbook to an XLSX file
    try {
        XLSX.writeFile(workbook, 'whatever_it_is.xlsx');
        showMessage('Going to Excel...', 'success');
    } catch (error) {
        showMessage(`Not going to Excel: ${error.message}`, 'error');
        console.error(error);
    }
});

/**
 * Limpia todos los datos de la tabla de la memoria y el almacenamiento local.
 */
clearDataButton.addEventListener('click', () => {
    if (chartData.length === 0) {
        showMessage('It is a new world now.', 'info');
        return;
    }
    // Usar una confirmación tipo modal personalizada en lugar de alert/confirm
    confirm('Are ya sure?')
        .then(result => {
            if (result) {
                chartData = [];
                saveChartData();
                renderChart();
                showMessage('This is a new world now.', 'success');
            }
        });
});

/**
 * Maneja los cambios en el título principal y lo guarda en el almacenamiento local.
 */
mainTitle.addEventListener('input', () => {
    localStorage.setItem('chartTitle', mainTitle.textContent);
    // Controlar la apariencia del texto de marcador de posición directamente a través del estilo
    if (mainTitle.textContent.trim() !== '' && mainTitle.textContent.trim() !== mainTitle.dataset.placeholder) {
        mainTitle.style.color = ''; // Quitar color de marcador de posición
        mainTitle.style.fontStyle = ''; // Quitar estilo de marcador de posición
    } else if (mainTitle.textContent.trim() === '') {
        mainTitle.textContent = mainTitle.dataset.placeholder;
        mainTitle.style.color = '#a0a0a0'; // Color del marcador de posición
        mainTitle.style.fontStyle = 'italic'; // Estilo del marcador de posición
    }
});

mainTitle.addEventListener('focus', () => {
    // Limpiar texto de marcador de posición al enfocar si es el marcador de posición mismo
    if (mainTitle.textContent.trim() === mainTitle.dataset.placeholder) {
        mainTitle.textContent = '';
        mainTitle.style.color = ''; // Quitar color de marcador de posición
        mainTitle.style.fontStyle = ''; // Quitar estilo de marcador de posición
    }
});

mainTitle.addEventListener('blur', () => {
    // Restaurar texto de marcador de posición al desenfocar si está vacío
    if (mainTitle.textContent.trim() === '') {
        mainTitle.textContent = mainTitle.dataset.placeholder;
        mainTitle.style.color = '#a0a0a0'; // Color del marcador de posición
        mainTitle.style.fontStyle = 'italic'; // Estilo del marcador de posición
    }
});


// Lógica simple de diálogo de confirmación personalizado (reemplaza confirm estándar)
function confirm(message) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
        background-color: white;
        padding: 30px;
        border-radius: 1rem;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        text-align: center;
        max-width: 400px;
        width: 90%;
    `;

    const text = document.createElement('p');
    text.textContent = message;
    text.style.cssText = `
        margin-bottom: 20px;
        font-size: 1.1rem;
        color: #333;
    `;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: center;
        gap: 15px;
    `;

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Yessirski!';
    // Estilos de botón aplicados directamente
    confirmBtn.style.cssText = `
        padding: 10px 20px;
        font-size: 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        background-color: #4c51bf;
        color: white;
        border: none;
        transition: background-color 0.2s;
    `;
    confirmBtn.onmouseover = () => confirmBtn.style.backgroundColor = '#434190';
    confirmBtn.onmouseout = () => confirmBtn.style.backgroundColor = '#4c51bf';


    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Not yet.';
    // Estilos de botón aplicados directamente
    cancelBtn.style.cssText = `
        padding: 10px 20px;
        font-size: 1rem;
        border-radius: 0.5rem;
        cursor: pointer;
        background-color: green;
        color: white;
        border: none;
        transition: background-color 0.2s;
    `;


    return new Promise((resolve) => {
        confirmBtn.onclick = () => {
            document.body.removeChild(modal);
            resolve(true);
        };
        cancelBtn.onclick = () => {
            document.body.removeChild(modal);
            resolve(false);
        };

        buttonContainer.appendChild(confirmBtn);
        buttonContainer.appendChild(cancelBtn);
        dialog.appendChild(text);
        dialog.appendChild(buttonContainer);
        modal.appendChild(dialog);
        document.body.appendChild(modal);
    });
}

// Carga inicial de datos cuando la página carga
document.addEventListener('DOMContentLoaded', loadChartData);
