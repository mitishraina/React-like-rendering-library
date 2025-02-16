# React-like-rendering-library

# Custom React-like Rendering Library

This project is a simplified implementation of a React-like rendering library. It provides a basic framework for creating, rendering, and updating UI components in a web application. The library includes core functionalities such as component instantiation, DOM manipulation, and lifecycle management.

## Table of Contents

- [Overview](#overview)
- [Key Components](#key-components)
- [Usage](#usage)

## Overview

The library is designed to mimic some of the core features of React, including:

- **Element Creation**: Using `createElement` to create elements with type and props.
- **Rendering**: Rendering elements to the DOM with `render`.
- **Component Lifecycle**: Managing component lifecycle with methods like `mountComponent`, `receiveComponent`, and `unmountComponent`.
- **State Management**: Using `setState` to update component state and trigger re-renders.

## Key Components

### Element Creation

- **`createElement(type, config, children)`**: Function to create an element with a specified type, configuration (props), and children.

### Rendering

- **`render(element, node)`**: Renders an element into a specified DOM node. It checks if the node is already a root and decides whether to update or mount the element.

### Component Lifecycle

- **`mount(element, node)`**: Mounts a new component into the DOM.
- **`update(element, node)`**: Updates an existing component in the DOM.
- **`unmountComponent(component)`**: Unmounts a component from the DOM.

### Component API

- **`Component` Class**: Base class for creating components. It includes methods for managing state and rendering elements.

### MultiChild and DOMComponentWrapper

- **`MultiChild` Class**: Manages mounting and unmounting of child components.
- **`DOMComponentWrapper` Class**: Wraps a DOM element and handles its lifecycle and property updates.

### Utilities

- **`DOM` Object**: Provides utility functions for DOM manipulation, such as `empty`, `appendChild`, `replaceNode`, `setProperty`, and `removeProperty`.
- **`Element` Object**: Validates elements to ensure they have the correct structure.
- **`Assert` Function**: Utility for asserting conditions and throwing errors if conditions are not met.

## Usage

To use this library, you can create components by extending the `Component` class and implementing the `render` method. Use `createElement` to define elements and `render` to mount them to the DOM.

Example:

## **JavaScript**
class MyComponent extends Component {
render() {
return createElement('div', { className: 'my-component' }, 'Hello, World!');
}
}
const element = createElement(MyComponent, null);
render(element, document.getElementById('root'));




## Running the Project

To run the project, follow these steps:

1. **Clone the Repository**

   Clone the repository to your local machine:

   ```bash
   git clone https://github.com/your-username/your-repo-name.git
   cd your-repo-name
   ```

2. **Set Up the Project**

   Ensure you have Node.js and npm installed. Initialize the project if not already done:

   ```bash
   npm init -y
   ```

3. **Create an HTML File**

   Create an `index.html` file with a root element:

   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>Custom React-like Library</title>
   </head>
   <body>
       <div id="root"></div>
       <script src="index.js"></script>
   </body>
   </html>
   ```

4. **Write or Import Your Library Code**

   Write your library code in `index.js` or import it if it's in separate files.

5. **Run the Project**

   Open `index.html` in a web browser to see your library in action. Alternatively, use a simple HTTP server:

   ```bash
   python -m http.server
   ```

   Then, open `http://localhost:8000` in your web browser.


