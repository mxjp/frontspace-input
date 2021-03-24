# Frontspace Input
A library for implementing accessible keyboard input for complex web applications.

# Setup
```bash
npm i @frontspace/input
```
```ts
import { setupFocusBehavior, setupInputDetection } from "@frontspace/input";

setupFocusBehavior();
setupInputDetection();
```

# Event Handling Conventions
This library works best when the following conventions are used for handling input events of any kind:
+ To **perform an action**, non-capturing event handlers should be used that stop event propagation if the action has been performed.
+ To **trigger side effects**, passive capturing event handlers should be used.

# Input Layers
Input layers are used to temporarily restrict keyboard interaction to all elements within a specific node. This can be used for implementing dialogs, popovers, dropdowns etc..
```ts
import { InputLayer, restoreFocus } ...

// Restrict keyboard interaction to "dialogElement":
const layer = InputLayer.create(dialogElement);

// Later, remove the restriction:
layer.dispose();

// After removing the restriction, the focus on the element that
// was focused before creating the input layer should be restored:
restoreFocus(layer);
```

# Detached Links
When implementing things like popovers, dropdowns or dialogs that can be nested and use absolutely positioned containers it can be difficult to know if they should be closed due to a user action in an other area of the application.

In the following example, the first popover should be closed when the user clicks anywhere outside of both popovers. The second popover should close when the user clicks outside of the second popover:
```html
<button id="anchor1">Toggle Popover</button>

<div id="container1" style="position: absolute; ...">
    Popover Content 1
    <button id="anchor2">Nested Popover</button>
</div>

<div id="container2" style="position: absolute; ...">
    Popover Content 2
</div>
```
For that purpose, a link can be created between anchors and their detached containers that later allows to check if an event originated from the anchors, containers or any nested anchors or containers:
```ts
import { createDetachedLink } ...

createDetachedLink(anchor1, container1);
createDetachedLink(anchor2, container2);
```
If an event indicative of a user action is detected, it can be checked, which popovers should be closed:
```ts
import { isForeignEvent } ...

window.addEventListener("mousedown", event => {
    if (isForeignEvent(event, container1)) {
        closePopover1();
    }
    if (isForeignEvent(event, container2)) {
        closePopover2();
    }
}, { capture: true, passive: true });
```

## Dialog Anchors
When creating a dialog, the current input layer can be used as an anchor to create a detached link.<br>
Note, that multiple containers can be linked to the same anchor but not the other way.
```ts
import { InputLayer, createDetachedLink }

createDetachedLink(InputLayer.current, dialogContainer);
InputLayer.create(dialogContainer);
```
