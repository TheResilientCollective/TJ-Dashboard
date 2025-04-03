
var sidebarContainer;
var sidebarContent;
var sidebarBody;
var sidebarHeader;
var minHeight;
var maxHeight;
var middleHeight;

document.addEventListener("DOMContentLoaded", function() {
    sidebarContainer = document.querySelector('#sidebar-container');
    sidebarContent = sidebarContainer.querySelector('#sidebar');
    sidebarHeader = sidebarContent.querySelector('#sidebar-header');
    sidebarBody = sidebarContent.querySelector('#sidebar-body');

    // Set initial height
    const initialHeight = sidebarContainer.getBoundingClientRect().height;
    sidebar_setHeight(initialHeight);

    setupSidebarHandle();
    // Update minHeight, maxHeight, and middleHeight on window resize
    window.addEventListener('resize', function() {
        setupSidebarHandle();
    });
});

function clearSidebarHandle() {
    sidebarHeader.removeEventListener('mousedown', sidebar_startDragUp);
    sidebarHeader.removeEventListener('touchstart', sidebar_startDragUp);
    sidebarHeader.removeEventListener('mousedown', sidebar_startDragDown);
    sidebarHeader.removeEventListener('touchstart', sidebar_startDragDown);
    sidebarContainer.removeEventListener('mousemove', sidebar_mouseMoveHandler);
    sidebarContainer.removeEventListener('touchmove', sidebar_mouseMoveHandler);
    sidebarContainer.removeEventListener('mouseup', sidebar_mouseUpHandler);
    sidebarContainer.removeEventListener('touchend', sidebar_mouseUpHandler);
    sidebarContainer.removeEventListener('mousemove', sidebar_mouseMoveHandlerDown);
    sidebarContainer.removeEventListener('touchmove', sidebar_mouseMoveHandlerDown);
    sidebarContainer.removeEventListener('mouseup', sidebar_mouseUpHandlerDown);
    sidebarContainer.removeEventListener('touchend', sidebar_mouseUpHandlerDown);

    sidebarContainer.style.height = '';
    sidebarContent.style.height = '';
    sidebarBody.style.height = '';
}

function setupSidebarHandle() {
    clearSidebarHandle();
    console.log("Cleared sidebar handle");
    // only apply in mobile view
    if (window.innerWidth > 768) {
        return;
    }

    // Calculate minHeight including the header's padding
    const headerStyles = window.getComputedStyle(sidebarHeader);
    const headerPadding = parseFloat(headerStyles.paddingTop) + parseFloat(headerStyles.paddingBottom);
    minHeight = sidebarHeader.getBoundingClientRect().height + headerPadding;
    maxHeight = window.innerHeight;
    middleHeight = (maxHeight + minHeight) / 2;

    // allow dragging on the header to expand the sidebar upwards
    sidebarHeader.addEventListener('mousedown', sidebar_startDragUp);
    sidebarHeader.addEventListener('touchstart', sidebar_startDragUp, { passive: false });

    // allow dragging on the header to expand the sidebar downwards
    sidebarHeader.addEventListener('mousedown', sidebar_startDragDown);
    sidebarHeader.addEventListener('touchstart', sidebar_startDragDown, { passive: false });
}

// Helper function to get the Y-coordinate from mouse or touch events
function sidebar_getEventY(event) {
    return event.touches ? event.touches[0].clientY : event.clientY;
}

function sidebar_startDragUp(e) {
    // Prevent dragging if the target is a clickable link
    if (e.target.tagName === 'A') return;

    e.preventDefault();
    document.addEventListener('mousemove', sidebar_mouseMoveHandler);
    document.addEventListener('touchmove', sidebar_mouseMoveHandler, { passive: false });
    document.addEventListener('mouseup', sidebar_mouseUpHandler);
    document.addEventListener('touchend', sidebar_mouseUpHandler);
}

function sidebar_mouseMoveHandler(e) {
    e.preventDefault();
    const newHeight = sidebar_getEventY(e) - sidebarContainer.getBoundingClientRect().top;
    if (newHeight >= minHeight && newHeight <= maxHeight) {
        sidebar_setHeight(newHeight);
    }
}

function sidebar_mouseUpHandler() {
    document.removeEventListener('mousemove', sidebar_mouseMoveHandler);
    document.removeEventListener('touchmove', sidebar_mouseMoveHandler);
    document.removeEventListener('mouseup', sidebar_mouseUpHandler);
    document.removeEventListener('touchend', sidebar_mouseUpHandler);

    // Snap to the closest height
    const currentHeight = parseFloat(sidebarContainer.style.height);
    const snapHeights = [minHeight, middleHeight, maxHeight];
    const closestHeight = snapHeights.reduce((prev, curr) =>
        Math.abs(curr - currentHeight) < Math.abs(prev - currentHeight) ? curr : prev
    );
    sidebar_setHeight(closestHeight);
}

function sidebar_startDragDown(e) {
    // Prevent dragging if the target is a clickable link
    if (e.target.tagName === 'A') return;

    e.preventDefault();
    document.addEventListener('mousemove', sidebar_mouseMoveHandlerDown);
    document.addEventListener('touchmove', sidebar_mouseMoveHandlerDown, { passive: false });
    document.addEventListener('mouseup', sidebar_mouseUpHandlerDown);
    document.addEventListener('touchend', sidebar_mouseUpHandlerDown);
}

function sidebar_mouseMoveHandlerDown(e) {
    e.preventDefault();
    const newHeight = sidebarContainer.getBoundingClientRect().bottom - sidebar_getEventY(e);
    if (newHeight >= minHeight && newHeight <= maxHeight) {
        sidebar_setHeight(newHeight);
    }
}

function sidebar_mouseUpHandlerDown() {
    document.removeEventListener('mousemove', sidebar_mouseMoveHandlerDown);
    document.removeEventListener('touchmove', sidebar_mouseMoveHandlerDown);
    document.removeEventListener('mouseup', sidebar_mouseUpHandlerDown);
    document.removeEventListener('touchend', sidebar_mouseUpHandlerDown);

    // Snap to the closest height
    const currentHeight = parseFloat(sidebarContainer.style.height);
    const snapHeights = [minHeight, middleHeight, maxHeight];
    const closestHeight = snapHeights.reduce((prev, curr) =>
        Math.abs(curr - currentHeight) < Math.abs(prev - currentHeight) ? curr : prev
    );
    sidebar_setHeight(closestHeight);
}

function sidebar_setHeight(height) {
    const paddingString = getComputedStyle(document.body).getPropertyValue("--p1");
    sidebarContainer.style.height = `${height}px`;
    sidebarContent.style.height = `${height}px`;
    sidebarBody.style.height = `calc(${height}px - ${sidebarHeader.getBoundingClientRect().height}px - ${paddingString} * 2)`;
}

function toggleSidebar() {
    var sidebar = document.querySelector("#sidebar-container");
    var sidebarContents = sidebar.querySelector("#sidebar");
    var sidebarHandle = document.querySelector("#sidebar-handle");
    var sidebarBtn = document.querySelector("#sidebar-btn");
    sidebarContents.classList.toggle("open");
    sidebarBtn.querySelector("i").classList.toggle("bi-chevron-left");
    sidebarBtn.querySelector("i").classList.toggle("bi-chevron-right");
    sidebarBtn.classList.toggle("open");
}