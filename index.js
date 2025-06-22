// script.js

// DOM element references
const chartBody = document.getElementById('chartBody');
const exportXlsxButton = document.getElementById('exportXlsx'); // Export XLSX button
const clearDataButton = document.getElementById('clearData');
const messageBox = document.getElementById('messageBox');
const mainTitle = document.getElementById('mainTitle'); // H1 element for the main title
const xlsxFile = document.getElementById('xlsxFile'); // XLSX file input

// Elements for manual data entry
const itemNameInput = document.getElementById('itemNameInput');
const itemRatingInput = document.getElementById('itemRatingInput');
const itemDateInput = document.getElementById('itemDateInput'); // Date input
const itemSpecialReleaseInput = document.getElementById('itemSpecialReleaseInput'); // New: Checkbox for special release
const addItemButton = document.getElementById('addItemButton');

// Array to store item objects:
// [{ name: 'Item A', rating: 3.5, date: 'YYYY-MM-DD', isSpecialRelease: false }]
let chartData = [];
// Variable to control which row is being edited. -1 means no row is in edit mode.
let editingRowIndex = -1; 

/**
 * Displays a temporary notification in a message box.
 * @param {string} message - The message to display.
 * @param {string} type - The type of message (e.g., 'success', 'error', 'info', 'warning'). Affects background color.
 */
function showMessage(message, type = 'success') {
    messageBox.textContent = message;
    // Apply styles directly
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
        messageBox.style.backgroundColor = '#4CAF50'; // Green for success
    } else if (type === 'error') {
        messageBox.style.backgroundColor = '#f44336'; // Red for error
    } else if (type === 'warning') {
        messageBox.style.backgroundColor = '#ff9800'; // Orange for warning
    }
    else {
        messageBox.style.backgroundColor = '#2196F3'; // Blue for info
    }
    messageBox.style.opacity = '1';

    // Hide after 3 seconds
    setTimeout(() => {
        messageBox.style.opacity = '0';
    }, 3000);
}

/**
 * Sorts table data by rating (descending),
 * then by 'isSpecialRelease' (special at the end), and then by date (ascending).
 */
function sortChartData() {
    chartData.sort((a, b) => {
        // 1. Primary sort: rating in descending order (highest first)
        if (b.rating !== a.rating) {
            return b.rating - a.rating;
        }

        // 2. Secondary sort: isSpecialRelease (false first, true last)
        // This will push special releases to the end within the same rating group.
        // false (0) - true (1) = -1 (a comes before)
        // true (1) - false (0) = 1 (a comes after)
        if (a.isSpecialRelease !== b.isSpecialRelease) {
            return (a.isSpecialRelease ? 1 : 0) - (b.isSpecialRelease ? 1 : 0);
        }

        // 3. Tertiary sort: date in ascending order (oldest first)
        // Convert date strings to Date objects for precise comparison.
        // 'T00:00:00' is added to ensure it's interpreted as local midnight
        // and avoid timezone offset issues when creating the Date object.
        const dateA = new Date(a.date + 'T00:00:00').getTime();
        const dateB = new Date(b.date + 'T00:00:00').getTime();
        return dateA - dateB;
    });
}

/**
 * Renders the table data in the HTML interface.
 */
function renderChart() {
    chartBody.innerHTML = ''; // Clear existing rows
    if (chartData.length === 0) {
        chartBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No data to display. Add an item manually or import an XLSX file.</td></tr>';
        return;
    }

    sortChartData(); // Sort data before rendering

    chartData.forEach((item, index) => {
        const row = document.createElement('tr');
        // Format date for display
        // 'T00:00:00' is added to ensure it's interpreted as local midnight
        // before formatting for display.
        const displayDate = item.date ? new Date(item.date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'N/A';

        row.innerHTML = `
            <td data-field="name">${item.name}</td>
            <td>
                <input type="number" step="0.5" min="0" max="5" value="${item.rating}" data-index="${index}" ${index === editingRowIndex ? '' : 'disabled'}>
                <button data-action="increment" data-index="${index}" ${index === editingRowIndex ? '' : 'disabled'}>+</button>
                <button data-action="decrement" data-index="${index}" ${index === editingRowIndex ? '' : 'disabled'}>-</button>
            </td>
            <td data-field="date">${displayDate}</td>
            <td data-field="isSpecialRelease" class="${item.isSpecialRelease ? 'text-purple-600 font-semibold' : 'text-gray-500'}">
                ${item.isSpecialRelease ? 'Special' : 'Normal'}
            </td>
            <td class="actions-cell">
                ${index === editingRowIndex ? `
                    <button data-action="save" data-index="${index}" class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md transition-colors duration-200">Save</button>
                    <button data-action="cancel" data-index="${index}" class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md transition-colors duration-200 ml-2">Cancel</button>
                ` : `
                    <button data-action="edit" data-index="${index}" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md transition-colors duration-200">Edit</button>
                    <button data-action="delete" data-index="${index}" class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md transition-colors duration-200 ml-2">Delete</button>
                `}
            </td>
        `;
        chartBody.appendChild(row);

        // If the current row is in edit mode, replace display elements with editable inputs
        if (index === editingRowIndex) {
            const nameCell = row.querySelector('td[data-field="name"]');
            const dateCell = row.querySelector('td[data-field="date"]');
            const specialReleaseCell = row.querySelector('td[data-field="isSpecialRelease"]');

            nameCell.innerHTML = `<input type="text" value="${item.name}" data-edit-field="name" class="p-1 border rounded w-full">`;
            dateCell.innerHTML = `<input type="date" value="${item.date}" data-edit-field="date" class="p-1 border rounded w-full">`;
            specialReleaseCell.innerHTML = `
                <input type="checkbox" ${item.isSpecialRelease ? 'checked' : ''} data-edit-field="isSpecialRelease" class="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                <label class="ml-1 text-sm text-gray-700">Special</label>
            `;
        }
    });

    // Add event listeners for rating inputs
    chartBody.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('change', handleRatingChange);
    });
}

/**
 * Saves the current table data to local storage.
 */
function saveChartData() {
    localStorage.setItem('customChartData', JSON.stringify(chartData));
}

/**
 * Loads table data from local storage on page load.
 * Ensures that old data without 'isSpecialRelease' get a default value.
 */
function loadChartData() {
    const storedData = localStorage.getItem('customChartData');
    if (storedData) {
        chartData = JSON.parse(storedData);
        // Ensure that old data without dates and without isSpecialRelease get a default value
        chartData.forEach(item => {
            if (!item.date) {
                // Generate current date in YYYY-MM-DD format locally
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                item.date = `${year}-${month}-${day}`;
            }
            if (typeof item.isSpecialRelease === 'undefined') {
                item.isSpecialRelease = false; // Defaults to false for old entries
            }
        });
        renderChart();
        showMessage('Data loaded from local storage.', 'info');
    } else {
        renderChart(); // Render empty table if no data
    }

    // Load and set the title from local storage
    const storedTitle = localStorage.getItem('chartTitle');
    if (storedTitle) {
        mainTitle.textContent = storedTitle;
        mainTitle.style.color = ''; // Remove placeholder color
        mainTitle.style.fontStyle = ''; // Remove placeholder style
    } else {
        // Set placeholder if empty
        mainTitle.textContent = mainTitle.dataset.placeholder;
        mainTitle.style.color = '#a0a0a0'; // Placeholder color
        mainTitle.style.fontStyle = 'italic'; // Placeholder style
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
                showMessage('The XLSX file is empty or contains no valid data.', 'error');
                return;
            }

            const headers = json[0].map(h => String(h).trim().toLowerCase()); // Normalize headers
            const nameColIndex = headers.indexOf('name');
            const ratingColIndex = headers.indexOf('rating');
            const dateColIndex = headers.indexOf('date');
            const specialReleaseColIndex = headers.indexOf('isspecialrelease'); // New index

            if (nameColIndex === -1 || ratingColIndex === -1 || dateColIndex === -1) {
                showMessage('"Name", "Rating", and "Date" are mandatory columns in the XLSX file.', 'error');
                return;
            }

            const newData = [];
            let hasParseError = false;

            json.slice(1).forEach((row, rowIndex) => { // Skip header row
                const name = row[nameColIndex] ? String(row[nameColIndex]).trim() : '';
                let rating = parseFloat(row[ratingColIndex]);
                let date = row[dateColIndex];
                // Read isSpecialRelease, if it doesn't exist or is invalid, defaults to false
                let isSpecialRelease = specialReleaseColIndex !== -1 ? (String(row[specialReleaseColIndex]).trim().toLowerCase() === 'true' || String(row[specialReleaseColIndex]).trim() === '1') : false;


                if (name === '') {
                    showMessage(`Warning: Row ${rowIndex + 2}: Item name is empty and the row will be skipped.`, 'warning');
                    hasParseError = true;
                    return; // Skip this row
                }

                if (isNaN(rating) || rating < 0 || rating > 5) {
                    rating = 0; // Default to 0 if invalid
                    showMessage(`Warning: Row ${rowIndex + 2}: Rating for "${name}" is invalid and set to 0.`, 'warning');
                    hasParseError = true;
                }

                // **XLSX date correction:**
                // Convert XLSX date number to YYYY-MM-DD string.
                // XLSX.utils.format_date is more robust and handles Excel's peculiarities.
                if (typeof date === 'number') {
                    date = XLSX.utils.format_date(date, 'YYYY-MM-DD');
                } else if (typeof date === 'string' && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                    // If the string is not YYYY-MM-DD, use the current local date.
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const day = String(today.getDate()).padStart(2, '0');
                    date = `${year}-${month}-${day}`;
                    showMessage(`Warning: Row ${rowIndex + 2}: Date for "${name}" is invalid and set to current date.`, 'warning');
                    hasParseError = true;
                } else if (!date) { // If date is null/undefined/empty
                    // Use current local date
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const day = String(today.getDate()).padStart(2, '0');
                    date = `${year}-${month}-${day}`;
                    showMessage(`Warning: Row ${rowIndex + 2}: No date provided for "${name}", current date was used.`, 'info');
                }

                newData.push({ name: name, rating: rating, date: date, isSpecialRelease: isSpecialRelease });
            });

            chartData = newData; // Replace old data with new
            saveChartData();
            renderChart();
            if (!hasParseError) {
                showMessage('XLSX file imported successfully!', 'success');
            } else {
                showMessage('XLSX file imported with some warnings.', 'warning');
            }

        } catch (error) {
            showMessage(`Error processing XLSX file: ${error.message}`, 'error');
            console.error(error);
        }
    };
    reader.readAsArrayBuffer(file);
});

/**
 * Handles changes in the rating input field.
 * @param {Event} event - The input change event.
 */
function handleRatingChange(event) {
    const index = parseInt(event.target.dataset.index); // Ensure index is parsed
    let newRating = parseFloat(event.target.value);

    if (isNaN(newRating) || newRating < 0) {
        newRating = 0; // Defaults to 0 if invalid
        showMessage('Rating is invalid and has been set to 0.', 'warning');
    } else if (newRating > 5) {
        newRating = 5; // Limit to 5
        showMessage('Rating cannot exceed 5 and has been set to 5.', 'warning');
    }

    chartData[index].rating = newRating;
    saveChartData();
    // Re-render to update the displayed value if limited and to reorder
    renderChart();
    showMessage('Rating updated.', 'success');
}

/**
 * Enters edit mode for the specified row.
 * @param {number} index - The index of the row to edit.
 */
function enterEditMode(index) {
    // If another row is already being edited, cancel it first
    if (editingRowIndex !== -1 && editingRowIndex !== index) {
        cancelRowEdit(editingRowIndex);
    }
    editingRowIndex = index;
    renderChart(); // Re-render the table to display the row in edit mode
    showMessage('Edit mode activated.', 'info');
}

/**
 * Saves the changes made to the edited row.
 * @param {number} index - The index of the edited row.
 */
function saveRowEdit(index) {
    const row = chartBody.children[index]; // Get the row by its index

    if (!row) {
        showMessage('Error: Row not found to save.', 'error');
        return;
    }

    const nameInput = row.querySelector('input[data-edit-field="name"]');
    const dateInput = row.querySelector('input[data-edit-field="date"]');
    const specialReleaseInput = row.querySelector('input[data-edit-field="isSpecialRelease"]');

    const newName = nameInput ? nameInput.value.trim() : chartData[index].name;
    const newDate = dateInput ? dateInput.value : chartData[index].date;
    const newIsSpecialRelease = specialReleaseInput ? specialReleaseInput.checked : chartData[index].isSpecialRelease;


    if (newName === '') {
        showMessage('Item name cannot be empty.', 'error');
        return;
    }

    // Update the chartData object
    chartData[index].name = newName;
    chartData[index].date = newDate;
    chartData[index].isSpecialRelease = newIsSpecialRelease;

    editingRowIndex = -1; // Exit edit mode
    saveChartData();
    renderChart(); // Re-render the table with saved changes
    showMessage('Item saved successfully.', 'success');
}

/**
 * Cancels edit mode and reverts changes.
 * @param {number} index - The index of the row that was being edited.
 */
function cancelRowEdit(index) {
    editingRowIndex = -1; // Exit edit mode
    renderChart(); // Re-render the table to discard changes
    showMessage('Edit canceled.', 'info');
}

/**
 * Handles clicks on table buttons (increment, decrement, delete, edit, save, cancel).
 * Uses event delegation.
 * @param {Event} event - The click event.
 */
function handleTableButtonClick(event) {
    const target = event.target;
    const action = target.dataset.action;
    const index = parseInt(target.dataset.index);

    if (isNaN(index)) return; // Ensure the index is valid

    if (action === 'increment') {
        if (chartData[index].rating < 5) {
            chartData[index].rating = Math.min(5, chartData[index].rating + 0.5);
            saveChartData();
            renderChart(); // Re-render to update and reorder if necessary
            showMessage('Rating incremented.', 'success');
        }
    } else if (action === 'decrement') {
        if (chartData[index].rating > 0) {
            chartData[index].rating = Math.max(0, chartData[index].rating - 0.5);
            saveChartData();
            renderChart(); // Re-render to update and reorder if necessary
            showMessage('Rating decremented.', 'success');
        }
    } else if (action === 'delete') {
        confirm('Are you sure you want to delete this item?')
            .then(result => {
                if (result) {
                    chartData.splice(index, 1); // Remove item from array
                    saveChartData();
                    renderChart();
                    showMessage('Item deleted.', 'success');
                } else {
                    showMessage('Deletion canceled.', 'info');
                }
            });
    } else if (action === 'edit') {
        enterEditMode(index);
    } else if (action === 'save') {
        saveRowEdit(index);
    } else if (action === 'cancel') {
        cancelRowEdit(index);
    }
}

/**
 * Handles adding a new item manually.
 */
addItemButton.addEventListener('click', () => {
    const name = itemNameInput.value.trim();
    let rating = parseFloat(itemRatingInput.value);
    // The input date is already in YYYY-MM-DD and is stored directly as such.
    let date = itemDateInput.value;
    const isSpecialRelease = itemSpecialReleaseInput.checked; // Get checkbox status

    if (name === '') {
        showMessage('Item name cannot be empty.', 'error');
        return;
    }

    if (isNaN(rating) || rating < 0 || rating > 5) {
        showMessage('Rating must be a number between 0 and 5.', 'error');
        return;
    }

    // If no date is provided, it defaults to the current local date
    if (date === '') {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        date = `${year}-${month}-${day}`;
        showMessage('No date provided, current date was used.', 'info');
    }

    chartData.push({ name: name, rating: rating, date: date, isSpecialRelease: isSpecialRelease });
    saveChartData();
    renderChart();
    showMessage('New item added.', 'success');

    // Clear inputs and reset checkbox
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
        showMessage('No data to export.', 'warning');
        return;
    }

    // Create a new workbook and add a worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(chartData);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ratings');

    // Write the workbook to an XLSX file
    try {
        XLSX.writeFile(workbook, 'my_ratings.xlsx');
        showMessage('Exporting to Excel...', 'success');
    } catch (error) {
        showMessage(`Error exporting to Excel: ${error.message}`, 'error');
        console.error(error);
    }
});

/**
 * Clears all table data from memory and local storage.
 */
clearDataButton.addEventListener('click', () => {
    if (chartData.length === 0) {
        showMessage('No data to clear.', 'info');
        return;
    }
    // Use a custom modal confirmation instead of alert/confirm
    confirm('Are you sure you want to clear all data? This action is irreversible.')
        .then(result => {
            if (result) {
                chartData = [];
                saveChartData();
                renderChart();
                showMessage('All data has been cleared.', 'success');
            } else {
                showMessage('Deletion operation canceled.', 'info');
            }
        });
});

/**
 * Handles changes to the main title and saves it to local storage.
 */
mainTitle.addEventListener('input', () => {
    localStorage.setItem('chartTitle', mainTitle.textContent);
    // Control placeholder text appearance directly via style
    if (mainTitle.textContent.trim() !== '' && mainTitle.textContent.trim() !== mainTitle.dataset.placeholder) {
        mainTitle.style.color = ''; // Remove placeholder color
        mainTitle.style.fontStyle = ''; // Remove placeholder style
    } else if (mainTitle.textContent.trim() === '') {
        mainTitle.textContent = mainTitle.dataset.placeholder;
        mainTitle.style.color = '#a0a0a0'; // Placeholder color
        mainTitle.style.fontStyle = 'italic'; // Placeholder style
    }
});

mainTitle.addEventListener('focus', () => {
    // Clear placeholder text on focus if it is the placeholder itself
    if (mainTitle.textContent.trim() === mainTitle.dataset.placeholder) {
        mainTitle.textContent = '';
        mainTitle.style.color = ''; // Remove placeholder color
        mainTitle.style.fontStyle = ''; // Remove placeholder style
    }
});

mainTitle.addEventListener('blur', () => {
    // Restore placeholder text on blur if it is empty
    if (mainTitle.textContent.trim() === '') {
        mainTitle.textContent = mainTitle.dataset.placeholder;
        mainTitle.style.color = '#a0a0a0'; // Placeholder color
        mainTitle.style.fontStyle = 'italic'; // Placeholder style
    }
});


// Simple custom confirmation dialog logic (replaces standard confirm)
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
    modal.classList.add('modal'); // Add class for potential external CSS styles

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
    dialog.classList.add('modal-dialog'); // Add class

    const text = document.createElement('p');
    text.textContent = message;
    text.style.cssText = `
        margin-bottom: 20px;
        font-size: 1.1rem;
        color: #333;
    `;
    text.classList.add('modal-text'); // Add class

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: center;
        gap: 15px;
    `;
    buttonContainer.classList.add('modal-buttons'); // Add class

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Yes, I\'m sure';
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
    confirmBtn.classList.add('modal-btn', 'modal-btn-confirm'); // Add classes
    confirmBtn.onmouseover = () => confirmBtn.style.backgroundColor = '#434190';
    confirmBtn.onmouseout = () => confirmBtn.style.backgroundColor = '#4c51bf';


    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'No, cancel';
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
    cancelBtn.classList.add('modal-btn', 'modal-btn-cancel'); // Add classes
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

// Initial data load when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadChartData();
    // Add the main event listener for event delegation
    // Ensures it's added only once to prevent multiple listeners
    chartBody.removeEventListener('click', handleTableButtonClick); // Remove in case it's loaded multiple times
    chartBody.addEventListener('click', handleTableButtonClick);
});
