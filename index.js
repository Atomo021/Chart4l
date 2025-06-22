// script.js

// Referencias a elementos del DOM
const chartBody = document.getElementById('chartBody');
const exportXlsxButton = document.getElementById('exportXlsx'); // Botón de exportar XLSX
const clearDataButton = document.getElementById('clearData');
const messageBox = document.getElementById('messageBox');
const mainTitle = document.getElementById('mainTitle'); // Elemento H1 para el título principal
const xlsxFile = document.getElementById('xlsxFile'); // Input de archivo XLSX

// Elementos para la entrada manual de datos
const itemNameInput = document.getElementById('itemNameInput');
const itemRatingInput = document.getElementById('itemRatingInput');
const itemDateInput = document.getElementById('itemDateInput'); // Input de fecha
const itemSpecialReleaseInput = document.getElementById('itemSpecialReleaseInput'); // Nuevo: Checkbox para lanzamiento especial
const addItemButton = document.getElementById('addItemButton');

// Array para almacenar los objetos de los elementos:
// [{ name: 'Item A', rating: 3.5, date: 'YYYY-MM-DD', isSpecialRelease: false }]
let chartData = [];

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
 * Ordena los datos de la tabla por calificación (descendente),
 * luego por 'isSpecialRelease' (especiales al final), y luego por fecha (ascendente).
 */
function sortChartData() {
    chartData.sort((a, b) => {
        // 1. Ordenamiento primario: calificación en orden descendente (más alta primero)
        if (b.rating !== a.rating) {
            return b.rating - a.rating;
        }

        // 2. Ordenamiento secundario: isSpecialRelease (false primero, true después)
        // Esto empujará las releases especiales al final dentro de la misma calificación.
        // false (0) - true (1) = -1 (a viene antes)
        // true (1) - false (0) = 1 (a viene después)
        if (a.isSpecialRelease !== b.isSpecialRelease) {
            return (a.isSpecialRelease ? 1 : 0) - (b.isSpecialRelease ? 1 : 0);
        }

        // 3. Ordenamiento terciario: fecha en orden ascendente (más antigua primero)
        // Convertir las cadenas de fecha a objetos Date para una comparación precisa.
        // Se añade 'T00:00:00' para asegurar que se interprete como medianoche local
        // y evitar problemas de desfase horario al crear el objeto Date.
        const dateA = new Date(a.date + 'T00:00:00').getTime();
        const dateB = new Date(b.date + 'T00:00:00').getTime();
        return dateA - dateB;
    });
}

/**
 * Renderiza los datos de la tabla en la interfaz HTML.
 */
function renderChart() {
    chartBody.innerHTML = ''; // Limpiar filas existentes
    if (chartData.length === 0) {
        chartBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No hay datos para mostrar. Agrega un elemento manualmente o importa un archivo XLSX.</td></tr>'; // Mensaje actualizado
        return;
    }

    sortChartData(); // Ordenar los datos antes de renderizar

    chartData.forEach((item, index) => {
        const row = document.createElement('tr');
        // Formatear fecha para mostrar
        // Se añade 'T00:00:00' para asegurar que se interprete como medianoche local
        // antes de formatear para la visualización.
        const displayDate = item.date ? new Date(item.date + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A';

        row.innerHTML = `
            <td>${item.name}</td>
            <td>
                <input type="number" step="0.5" min="0" max="5" value="${item.rating}" data-index="${index}">
                <button data-action="increment" data-index="${index}">+</button>
                <button data-action="decrement" data-index="${index}">-</button>
            </td>
            <td>${displayDate}</td>
            <td class="${item.isSpecialRelease ? 'text-purple-600 font-semibold' : 'text-gray-500'}">
                ${item.isSpecialRelease ? 'Especial' : 'Normal'}
            </td>
            <td>
                <button data-action="delete" data-index="${index}">Eliminar</button>
            </td>
        `;
        chartBody.appendChild(row);
    });

    // Añadir escuchadores de eventos para los inputs de calificación y botones
    chartBody.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('change', handleRatingChange);
    });
    chartBody.querySelectorAll('button').forEach(button => {
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
 * Asegura que los datos antiguos sin 'isSpecialRelease' obtengan un valor predeterminado.
 */
function loadChartData() {
    const storedData = localStorage.getItem('customChartData');
    if (storedData) {
        chartData = JSON.parse(storedData);
        // Asegurarse de que los datos antiguos sin fechas y sin isSpecialRelease obtengan un valor predeterminado
        chartData.forEach(item => {
            if (!item.date) {
                // Generar la fecha actual en formato YYYY-MM-DD localmente
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                item.date = `${year}-${month}-${day}`;
            }
            if (typeof item.isSpecialRelease === 'undefined') {
                item.isSpecialRelease = false; // Predeterminado a false para entradas antiguas
            }
        });
        renderChart();
        showMessage('Datos cargados desde el almacenamiento local.', 'info');
    } else {
        renderChart(); // Renderizar tabla vacía si no hay datos
    }

    // Cargar y establecer el título desde el almacenamiento local
    const storedTitle = localStorage.getItem('chartTitle');
    if (storedTitle) {
        mainTitle.textContent = storedTitle;
        mainTitle.style.color = ''; // Quitar color de marcador de posición
        mainTitle.style.fontStyle = ''; // Quitar estilo de marcador de posición
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

            const headers = json[0].map(h => String(h).trim().toLowerCase()); // Normalizar encabezados
            const nameColIndex = headers.indexOf('name');
            const ratingColIndex = headers.indexOf('rating');
            const dateColIndex = headers.indexOf('date');
            const specialReleaseColIndex = headers.indexOf('isspecialrelease'); // Nuevo índice

            if (nameColIndex === -1 || ratingColIndex === -1 || dateColIndex === -1) {
                showMessage('"Name", "Rating" y "Date" son columnas obligatorias en el archivo XLSX.', 'error');
                return;
            }

            const newData = [];
            let hasParseError = false;

            json.slice(1).forEach((row, rowIndex) => { // Skip header row
                const name = row[nameColIndex] ? String(row[nameColIndex]).trim() : '';
                let rating = parseFloat(row[ratingColIndex]);
                let date = row[dateColIndex];
                // Leer isSpecialRelease, si no existe o es inválido, por defecto es false
                let isSpecialRelease = specialReleaseColIndex !== -1 ? (String(row[specialReleaseColIndex]).trim().toLowerCase() === 'true' || String(row[specialReleaseColIndex]).trim() === '1') : false;


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

                // **Corrección para la fecha de XLSX:**
                // Convertir número de fecha de XLSX a cadena YYYY-MM-DD.
                // XLSX.utils.format_date es más robusto y maneja las peculiaridades de Excel.
                if (typeof date === 'number') {
                    date = XLSX.utils.format_date(date, 'YYYY-MM-DD');
                } else if (typeof date === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                    // Si la cadena no es YYYY-MM-DD, usar la fecha actual local.
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const day = String(today.getDate()).padStart(2, '0');
                    date = `${year}-${month}-${day}`;
                    showMessage(`Advertencia: Fila ${rowIndex + 2}: La fecha para "${name}" no es válida y se estableció en la fecha actual.`, 'warning');
                    hasParseError = true;
                } else if (!date) { // Si la fecha es nula/indefinida/vacía
                    // Usar la fecha actual local
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const day = String(today.getDate()).padStart(2, '0');
                    date = `${year}-${month}-${day}`;
                    showMessage(`Advertencia: Fila ${rowIndex + 2}: No se proporcionó fecha para "${name}", se usó la fecha actual.`, 'info');
                }

                newData.push({ name: name, rating: rating, date: date, isSpecialRelease: isSpecialRelease });
            });

            chartData = newData; // Reemplazar datos antiguos con los nuevos
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
    // La fecha del input ya está en YYYY-MM-DD y se almacena directamente así.
    let date = itemDateInput.value;
    const isSpecialRelease = itemSpecialReleaseInput.checked; // Obtener el estado del checkbox

    if (name === '') {
        showMessage('El nombre del elemento no puede estar vacío.', 'error');
        return;
    }

    if (isNaN(rating) || rating < 0 || rating > 5) {
        showMessage('La calificación debe ser un número entre 0 y 5.', 'error');
        return;
    }

    // Si no se proporciona fecha, se establece por defecto a la fecha actual local
    if (date === '') {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        date = `${year}-${month}-${day}`;
        showMessage('No se proporcionó fecha, se usó la fecha actual.', 'info');
    }

    chartData.push({ name: name, rating: rating, date: date, isSpecialRelease: isSpecialRelease });
    saveChartData();
    renderChart();
    showMessage('Nuevo elemento añadido.', 'success');

    // Limpiar inputs y resetear checkbox
    itemNameInput.value = '';
    itemRatingInput.value = '';
    itemDateInput.value = '';
    itemSpecialReleaseInput.checked = false;
});

/**
 * Exports the current chart data to an XLSX file using SheetJS.
 */
exportXlsxButton.addEventListener('click', () => {
    if (chartData.length === 0) {
        showMessage('No hay datos para exportar.', 'warning');
        return;
    }

    // Crear un nuevo libro y añadir una hoja de trabajo
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(chartData);

    // Añadir la hoja de trabajo al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Calificaciones');

    // Escribir el libro en un archivo XLSX
    try {
        XLSX.writeFile(workbook, 'mis_calificaciones.xlsx');
        showMessage('Exportando a Excel...', 'success');
    } catch (error) {
        showMessage(`Error al exportar a Excel: ${error.message}`, 'error');
        console.error(error);
    }
});

/**
 * Limpia todos los datos de la tabla de la memoria y el almacenamiento local.
 */
clearDataButton.addEventListener('click', () => {
    if (chartData.length === 0) {
        showMessage('No hay datos para borrar.', 'info');
        return;
    }
    // Usar una confirmación tipo modal personalizada en lugar de alert/confirm
    confirm('¿Estás seguro de que quieres borrar todos los datos? Esta acción es irreversible.')
        .then(result => {
            if (result) {
                chartData = [];
                saveChartData();
                renderChart();
                showMessage('Todos los datos han sido borrados.', 'success');
            } else {
                showMessage('Operación de borrado cancelada.', 'info');
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
    modal.classList.add('modal'); // Añadir clase para posibles estilos CSS externos

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
    dialog.classList.add('modal-dialog'); // Añadir clase

    const text = document.createElement('p');
    text.textContent = message;
    text.style.cssText = `
        margin-bottom: 20px;
        font-size: 1.1rem;
        color: #333;
    `;
    text.classList.add('modal-text'); // Añadir clase

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: center;
        gap: 15px;
    `;
    buttonContainer.classList.add('modal-buttons'); // Añadir clase

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Sí, estoy seguro';
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
    confirmBtn.classList.add('modal-btn', 'modal-btn-confirm'); // Añadir clases
    confirmBtn.onmouseover = () => confirmBtn.style.backgroundColor = '#434190';
    confirmBtn.onmouseout = () => confirmBtn.style.backgroundColor = '#4c51bf';


    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'No, cancelar';
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
    cancelBtn.classList.add('modal-btn', 'modal-btn-cancel'); // Añadir clases
    cancelBtn.onmouseover = () => cancelBtn.style.backgroundColor = '#006400';
    cancelBtn.onmouseout = () => cancelBtn.style.backgroundColor = 'green';


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
