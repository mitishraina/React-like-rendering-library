function createElement(type, config, children) {
  // clone the passed in config(props). In react, we move some special props off of this object(keys, refs).
  let props = Object.assign({}, config);

  //build props.children, we'll make it an array if we have more than 1.
  let childCount = arguments.length - 2;
  if (childCount === 1) {
    props.children = children;
  } else if (childCount > 1) {
    props.children = [].slice.call(arguments, 2);
  }
  return {
    type,
    props,
  };
}

// bookkeepign bits. we need to store some data and ensure that no roots conflict.
const ROOT_KEY = "dlthmRootId";
const instanceByRootId = {};
let rootID = 1;

function isRoot(node) {
  if (node.dataset[ROOT_KEY]) {
    return true;
  }
  return false;
}

function render(element, node) {
  Assert(Element.isValidElement(element));

  //first check if we've already rendered into this node. if so, this is an update. otherwise this is an initial render.
  if (isRoot(node)) {
    update(element, node);
  } else {
    mount(element, node);
  }
}

function mount(element, node) {
  //create the internal instance. this abstracts away the different components types.
  let component = instantiateComponent(element);

  //store this for later updates and mounting.
  instanceByRootId[rootID] = component;

  // mounting generates dom nodes, this is where react determines if we're re-mounting server-rendered content.
  let renderedNode = Reconciler.mountComponent(component, node);

  //do some dom operations, marking this node as a root, and inserting the new dom as a child.
  node.dataset[ROOT_KEY] = rootID;
  DOM.empty(node);
  DOM.appendChild(node, renderedNode);
  rootID++;
}

function update(element, node) {
  //find the internal instance and update it
  let id = node.dataset[ROOT_KEY];
  let instance = instanceByRootId[id];

  let prevElem = instance._currentElement;
  if (shouldUpdateComponent(prevElem, element)) {
    //send the new element to the instance.
    Reconciler.receiveComponent(instance, element);
  } else {
    // unmount and then mount the new one
    unmountComponentAtNode(node);
    mount(element, node);
  }
}

//this determines if we're going to end up reusing an internal instance or not. this is one of the big shortcuts that react does. stopping us from instantiating and comparing full trees. instead we immediately throw away a subtree when updating from one element type to another

function shouldUpdateComponent(prevElement, nextElement) {
  // simply use element.type
  // 'div' notequal(===) 'span'
  // colorswatch notequal(===) counterbutton
  //note: in react we would also look at the key
  return prevElement.type === nextElement.type;
}

function mountComponent(component) {
  //this will generate the dom node that will go into the dom, we defer to the component instance since it will contain the rendered specific implementation of what that means. thsi allows the reconciler to be reused across dom and native
  let markup = component.mountComponent();

  //react does more work here to ensure that refs work. we dont need to.
  return markup;
}

function receiveComponent(component, element) {
  // shortcut! we wont do anything if the next element is the same as the current one. this is unlikeyly in normal jsx usage, but it an optimzation that can be unlocked with babel's inline-element transform.
  let prevElement = component._currentElement;
  if (prevElement === element) {
    return;
  }
  //defer to the instance.
  component.receiveComponent(element);
}

function unmountComponent(component) {
  //again, react will do more work here for refs. we wont
  component.unmountComponent();
}

function performUpdateIfNecessary(component) {
  component.performUpdateIfNecessary();
}

// COMPONENT API
class Component {
  constructor(props) {
    // set up some fields for later use.
    this.props = props;
    this._currentElement = null;
    this._pendingState = null;
    this._renderedComponent = null;
    this._renderedNode = null;

    assert(typeof this.render === "function");
  }

  setState(partialState) {
    // react uses a queue here to allow batching.
    this._pendingState = Object.assign({}, this.state, partialState);
    Reconciler.performUpdateIfNecessary(this);
  }

  // we have a helper method here to avoid having a wrapper instance. react does that - its a smarter implementation and hides required helpers, internal data. that also allows renderers to have thier own implementation specific wrappers. this ensure that react.component is available on native

  _construct(element) {
    this._currentElement = element;
  }

  mountComponent() {
    // this is where the magic starts to happen. we call the render method to get our actual rendered element. note: since react dont support arrays or other types, we can safely assume we have an element.
    let renderedElement = this.render();
    //todo: call componentWillMount
    // actually instantiate the rendered element.
    let component = instantiateComponent(renderedElement);

    this._renderedComponent = component;

    //generate markup for component & recurse! since composite components instances dont have a dom representation of their own, this markup will actually be the dom nodes(or native views)
    let renderedNode = Reconciler.mountComponent(component, node);
    return renderedNode;
  }

  receiveComponent(nextElement) {
    this.updateComponent(nextElement);
  }

  updateComponent(nextElement) {
    let prevElement = this._currentElement;

    //when just updating state, nextElement will be the same as the previously rendered element, otherwise, this update is the result of a parent re-rendering
    if (prevElement !== nextElement) {
      //todo: call componentWillReceiveProps
    }

    //todo: call shouldComponentupdate and return if false
    //todo: call componentWillUpdate

    //update instance data
    this._currentElement = nextElement;
    this.props = nextElement.props;
    if (this._pendingState) {
      this.state = this._pendingState;
    }
    this._pendingState = null;

    //we need the previously rendered element (render() result) to compare to the next render() result.
    let prevRenderedElement = this._renderedComponent._currentElement;
    let nextRenderedElement = this.render();

    //just like a top-level update, determine if we should update or replace.
    let shouldUpdate = shouldUpdateComponent(
      prevRenderedElement,
      nextRenderedElement
    );

    if (shouldUpdate) {
      Reconciler.receiveComponent(this._renderedComponent, nextRenderedElement);
    } else {
      Reconciler.unmountComponent(this._renderedComponent);
      let nextRenderedComponent = instantiateComponent(nextRenderedElement);
      let nextMarkup = Reconciler.mountComponent(nextRenderedComponent);
      DOM.replaceNode(this._renderedComponent._domNode, nextMarkup);
      this._renderedComponent = nextRenderedComponent;
    }
  }
}

// Move MultiChild class before DOMComponentWrapper
class MultiChild {
  mountChildren(children) {
    if (!children) return [];
    return Array.isArray(children)
      ? children.map((child) => instantiateComponent(child).mountComponent())
      : [instantiateComponent(children).mountComponent()];
  }

  unmountChildren() {
    // Unmount all child components
    if (this._renderedChildren) {
      Object.values(this._renderedChildren).forEach((child) => {
        Reconciler.unmountComponent(child);
      });
    }
  }
}

class DOMComponentWrapper extends MultiChild {
  constructor(element) {
    super();
    this._currentElement = element;
    this._domNode = null;
  }

  mountComponent() {
    //create the dom element, set attributes, recurese for children.
    let el = document.createElement(this._currentElement.type);
    this._domNode = el;
    this._updateDOMProperties({}, this._currentElement.props);
    this._createInitialDOMChildren(this._currentElement.props);
    return el;
  }

  unmountComponent() {
    //react needs to do some special handling for some node types, specifically removing event handlers that had to be attached to this node and couldnt be handled through propagation
    this.unmountChildren();
  }

  receiveComponent(prevElement, nextElement) {
    //debugger
    this._currentElement = nextElement;
    this._updateDOMProperties(prevElement.props, nextElement.props);
  }

  _createInitialDOMChildren(props) {
    //we'll take a short cut for text content
    if (childType === "string" || childType === "number") {
      this._domNode.textContent = props.children;
    }

    // single element or array
    else if (props.children) {
      let mountImages = this.unmountChildren(props.children);

      DOM.appendChildren(this._domNode, mountImages);
    }
  }

  _updateDOMChildren(prevProps, nextProps) {
    // react does a bunch of work to handle
  }

  _updateDOMProperties(prevProps, nextProps) {
    // Handle property updates
    Object.keys(prevProps).forEach((propKey) => {
      if (propKey !== "children" && !nextProps.hasOwnProperty(propKey)) {
        // Remove properties that are no longer present
        DOM.removeProperty(this._domNode, propKey);
      }
    });

    Object.keys(nextProps).forEach((propKey) => {
      if (propKey !== "children") {
        // Update changed properties
        DOM.setProperty(this._domNode, propKey, nextProps[propKey]);
      }
    });
  }

  _updateDOMChildren(prevProps, nextProps) {
    const prevType = typeof prevProps.children;
    const nextType = typeof nextProps.children;

    // Handle text content updates
    if (nextType === "string" || nextType === "number") {
      this._domNode.textContent = nextProps.children;
    } else {
      // Handle element updates
      const prevChildren = prevProps.children || [];
      const nextChildren = nextProps.children || [];
      this.updateChildren(nextChildren);
    }
  }
}

// Add DOM utility object
const DOM = {
  empty(node) {
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  },

  appendChild(node, child) {
    node.appendChild(child);
  },

  appendChildren(node, children) {
    children.forEach((child) => node.appendChild(child));
  },

  replaceNode(oldNode, newNode) {
    oldNode.parentNode.replaceChild(newNode, oldNode);
  },

  setProperty(node, name, value) {
    if (name === "className") {
      node.className = value;
    } else if (name === "style") {
      Object.assign(node.style, value);
    } else if (name.startsWith("on")) {
      const eventType = name.toLowerCase().slice(2);
      node.addEventListener(eventType, value);
    } else {
      node.setAttribute(name, value);
    }
  },

  removeProperty(node, name) {
    if (name.startsWith("on")) {
      const eventType = name.toLowerCase().slice(2);
      node.removeEventListener(eventType);
    } else {
      node.removeAttribute(name);
    }
  },
};

// Add Element validation
const Element = {
  isValidElement(element) {
    return (
      element &&
      typeof element === "object" &&
      "type" in element &&
      "props" in element
    );
  },
};

// Add Assert utility
function Assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}
