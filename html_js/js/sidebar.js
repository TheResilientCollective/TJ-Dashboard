var sidebarContainer = document.querySelector('#sidebar-container');
var sidebarContent = sidebarContainer.querySelector('#sidebar');
var sidebarBody = sidebarContent.querySelector('#sidebar-body');
var sidebarHeader = sidebarContent.querySelector('#sidebar-header');
var sidebarHandle = sidebarContent.querySelector('#sidebar-handle');
var minHeight;
var maxHeight;
var middleHeight;

sidebar_setHeight();
setupSidebarHandle();

window.addEventListener('resize', function() {
    sidebar_setHeight();
    setupSidebarHandle();
});

function clearSidebarHandle() {
    sidebarHandle.removeEventListener('mousedown', sidebar_startDragUp);
    sidebarHandle.removeEventListener('touchstart', sidebar_startDragUp);
    sidebarHandle.removeEventListener('mousedown', sidebar_startDragDown);
    sidebarHandle.removeEventListener('touchstart', sidebar_startDragDown);
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
    // only apply in mobile view
    if (window.innerWidth > 768) {
        sidebar_setHeight();
        return;
    }

    // Calculate minHeight including the handle's padding
    const handleStyles = window.getComputedStyle(sidebarHandle);
    const handlePadding = parseFloat(handleStyles.paddingTop) + parseFloat(handleStyles.paddingBottom);
    const headerPadding = parseFloat(getComputedStyle(sidebarHeader).paddingTop) + parseFloat(getComputedStyle(sidebarHeader).paddingBottom);
    minHeight = sidebarHeader.getBoundingClientRect().height + sidebarHandle.getBoundingClientRect().height + handlePadding + headerPadding;
    maxHeight = window.innerHeight;
    middleHeight = (maxHeight + minHeight) / 2;

    // allow dragging on the handle to expand the sidebar upwards
    sidebarHandle.addEventListener('mousedown', sidebar_startDragUp);
    sidebarHandle.addEventListener('touchstart', sidebar_startDragUp, { passive: false });

    // allow dragging on the handle to expand the sidebar downwards
    sidebarHandle.addEventListener('mousedown', sidebar_startDragDown);
    sidebarHandle.addEventListener('touchstart', sidebar_startDragDown, { passive: false });
}

// Helper function to get the Y-coordinate from mouse or touch events
function sidebar_getEventY(event) {
    return event.touches ? event.touches[0].clientY : event.clientY;
}

function sidebar_startDragUp(e) {
    // Prevent dragging if the target is a clickable link
    if (e.target.tagName === 'IMG') return;

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
    if (e.target.tagName === 'IMG') return;

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

function sidebar_setHeight(height=-1) {
    if (height < 0) {
        height = sidebarContainer.getBoundingClientRect().height;
    }
    
    sidebarContainer.style.height = `${height}px`;
    sidebarContent.style.height = `${height}px`;
    const heightString =  `calc(${height}px - ${sidebarHeader.getBoundingClientRect().height}px - (var(--p1) * 4))`;
    sidebarBody.style.height = heightString;
}

function toggleSidebar() {
    var sidebar = document.querySelector("#sidebar-container");
    var sidebarContents = sidebar.querySelector("#sidebar");
    var sidebarBtn = document.querySelector("#sidebar-btn");
    sidebarContents.classList.toggle("open");
    sidebarBtn.querySelector("i").classList.toggle("bi-chevron-left");
    sidebarBtn.querySelector("i").classList.toggle("bi-chevron-right");
    sidebarBtn.classList.toggle("open");

    if (sidebarContents.classList.contains("open")) {
        document.querySelector("#top-bar-container").style.left = "";
    }
    else {
        document.querySelector("#top-bar-container").style.left = "var(--p2)";
    }
}