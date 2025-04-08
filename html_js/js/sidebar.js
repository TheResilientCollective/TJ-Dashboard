var sidebarContainer = document.querySelector('#sidebar-container');
var sidebarContent = sidebarContainer.querySelector('#sidebar');
var sidebarBody = sidebarContent.querySelector('#sidebar-body');
var sidebarHeader = sidebarContent.querySelector('#sidebar-header');
var sidebarHandle = sidebarContent.querySelector('#sidebar-handle');
var sidebarTitle = sidebarContent.querySelector('#sidebar-title');
const grippables = [sidebarHandle, sidebarHeader];

// Variables to store drag state
var isDraggingSidebar = false;
var startY;
var initialHeight;

// Height boundaries
var minHeight;
var maxHeight;
var middleHeight;

// Initial setup
sidebar_setHeight();
setupSidebarHandle();
sidebar_setHeight();

window.addEventListener('resize', function() {
    sidebar_setHeight();
    setupSidebarHandle();
    sidebar_setHeight();
});

function clearSidebarHandle() {
    // Remove all event listeners from grippables
    for (const grippable of grippables) {
        grippable.removeEventListener('mousedown', sidebar_startDrag);
        grippable.removeEventListener('touchstart', sidebar_startDrag);
    }

    // Remove listeners from document
    document.removeEventListener('mousemove', sidebar_dragMove);
    document.removeEventListener('touchmove', sidebar_dragMove);
    document.removeEventListener('mouseup', sidebar_dragEnd);
    document.removeEventListener('touchend', sidebar_dragEnd);

    // Reset inline styles
    sidebarContainer.style.height = '';
    sidebarContent.style.height = '';
    sidebarBody.style.height = '';
}

function setupSidebarHandle() {
    clearSidebarHandle();

    // Only apply draggable behavior in mobile view
    if (window.innerWidth > 768) {
        return;
    }

    // Calculate height boundaries
    // Ensure calculations happen *after* potential layout shifts or element rendering
    requestAnimationFrame(() => {
        const handleStyles = window.getComputedStyle(sidebarHandle);
        const handlePadding = parseFloat(handleStyles.paddingTop) + parseFloat(handleStyles.paddingBottom);
        // Include header padding for more accurate minHeight
        const headerStyles = window.getComputedStyle(sidebarHeader);
        const headerPadding = parseFloat(headerStyles.paddingTop) + parseFloat(headerStyles.paddingBottom);
        // Recalculate bounding rects as they might change
        const headerRect = sidebarHeader.getBoundingClientRect();
        const handleRect = sidebarHandle.getBoundingClientRect();

        // Min height is header + handle + relevant paddings
        minHeight = sidebarHeader.getBoundingClientRect().height + sidebarHandle.getBoundingClientRect().height + handlePadding + headerPadding;
        maxHeight = window.innerHeight; // Use full viewport height as max
        middleHeight = (maxHeight + minHeight) / 2; // Or another desired intermediate height

        // Ensure initial height respects boundaries (in case it was set differently)
        const currentHeight = sidebarContainer.getBoundingClientRect().height;
        if (currentHeight < minHeight) sidebar_setHeight(minHeight);
        if (currentHeight > maxHeight) sidebar_setHeight(maxHeight);

        // Attach event listeners to grippables
        for (const grippable of grippables) {
            grippable.addEventListener('mousedown', sidebar_startDrag);
            grippable.addEventListener('touchstart', sidebar_startDrag, { passive: false });
        }
    });
}

// Helper function to get the Y-coordinate from mouse or touch events
function sidebar_getEventY(event) {
    // If it's a touch event, get Y from the first touch point
    return event.touches ? event.touches[0].clientY : event.clientY;
}

function sidebar_startDrag(e) {
    // Prevent dragging if the target is interactive (like an image potentially inside the title)
    // Adjust this check if necessary (e.g., check for buttons, links etc.)
    if (e.target.tagName === 'IMG' || e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === "SELECT") {
        return; // Don't start drag on interactive elements
    }

    // Prevent default actions like text selection during drag
    e.preventDefault();

    isDraggingSidebar = true;
    startY = sidebar_getEventY(e); // Record starting Y position
    initialHeight = sidebarContainer.getBoundingClientRect().height; // Record starting height

    // Add move and end listeners to the *document* to capture events
    // even if the cursor moves off the handle/title
    document.addEventListener('mousemove', sidebar_dragMove);
    document.addEventListener('touchmove', sidebar_dragMove, { passive: false }); // passive: false to allow preventDefault
    document.addEventListener('mouseup', sidebar_dragEnd);
    document.addEventListener('touchend', sidebar_dragEnd);

    // Optional: Add a class to body or container for visual feedback (e.g., change cursor)
    document.body.style.cursor = 'ns-resize'; // Indicate vertical resizing
    sidebarContainer.classList.add('dragging');
}

function sidebar_dragMove(e) {
    if (!isDraggingSidebar) return;

    // We prevent default move behavior (like scrolling on touch) inside startDrag's touchstart
    // But sometimes it's needed here too for touchmove
    e.preventDefault();

    const currentY = sidebar_getEventY(e);
    const deltaY = currentY - startY; // How much the cursor moved vertically

    // Adjust height based on drag direction:
    // Moving cursor UP (negative deltaY) should INCREASE height.
    // Moving cursor DOWN (positive deltaY) should DECREASE height.
    // So, newHeight = initialHeight - deltaY
    let newHeight = initialHeight - deltaY;

    // Clamp the new height between minHeight and maxHeight
    newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

    // Apply the new height
    sidebar_setHeight(newHeight);
}

function sidebar_dragEnd() {
    if (!isDraggingSidebar) return;

    isDraggingSidebar = false;

    // Remove listeners from the document
    document.removeEventListener('mousemove', sidebar_dragMove);
    document.removeEventListener('touchmove', sidebar_dragMove);
    document.removeEventListener('mouseup', sidebar_dragEnd);
    document.removeEventListener('touchend', sidebar_dragEnd);

    // Snap to the closest predefined height
    const currentHeight = parseFloat(sidebarContainer.style.height); // Get the final height
    // Ensure snapHeights are valid numbers
    const snapHeights = [minHeight, middleHeight, maxHeight].filter(h => !isNaN(h));

    if (snapHeights.length > 0) {
         const closestHeight = snapHeights.reduce((prev, curr) =>
            Math.abs(curr - currentHeight) < Math.abs(prev - currentHeight) ? curr : prev
        );
        sidebar_setHeight(closestHeight); // Snap to the determined height
    }


    // Optional: Remove visual feedback styles
    document.body.style.cursor = ''; // Reset cursor
    sidebarContainer.classList.remove('dragging');
}

function sidebar_setHeight(height = -1) {
    if (height < 0) {
        height = sidebarContainer.getBoundingClientRect().height;
    }
    
    sidebarContainer.style.height = `${height}px`;
    sidebarContent.style.height = `${height}px`;
    const heightString =  `calc(${height}px - ${sidebarHeader.getBoundingClientRect().height}px - (var(--p1) * 4))`;
    sidebarBody.style.height = heightString;
}

// --- toggleSidebar function remains the same ---
function toggleSidebar() {
    var sidebar = document.querySelector("#sidebar-container");
    var sidebarContents = sidebar.querySelector("#sidebar");
    var sidebarBtn = document.querySelector("#sidebar-btn");
    sidebarContents.classList.toggle("open");
    sidebarBtn.querySelector("i").classList.toggle("bi-chevron-left");
    sidebarBtn.querySelector("i").classList.toggle("bi-chevron-right");
    sidebarBtn.classList.toggle("open");

    // Adjust adjacent elements based on sidebar state
    const topBar = document.querySelector("#top-bar-container");
    const mapDisclaimers = document.querySelector("#map-footer-bar");

    if (sidebarContents.classList.contains("open")) {
        if (topBar) topBar.style.left = ""; // Reset to default (likely CSS defined)
        if (mapDisclaimers) mapDisclaimers.style.left = "calc(var(--p2) + var(--sidebar-desktop-width))";
    } else {
        if (topBar) topBar.style.left = "var(--p2)";
        if (mapDisclaimers) mapDisclaimers.style.left = "var(--p2)";
    }
}