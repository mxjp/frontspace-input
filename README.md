# Frontspace Input
A library for implementing accessible keyboard input for complex web applications.

## Setup
```bash
npm i @frontspace/input
```
```ts
import { setupFocusBehavior, setupInputDetection } from "@frontspace/input";

setupFocusBehavior();
setupInputDetection();
```

## Event Handling Conventions
This library works best when the following conventions are used when handling input events of any kind:
+ To **perform an action**, non-capturing event handlers should be used that stop event propagation if the action has been performed.
+ To **trigger side effects**, passive capturing event handlers should be used.

## Input Layers
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
