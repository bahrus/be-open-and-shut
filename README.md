# be-open-and-shut

Automatically close an element that has an "pen" state, after clicking away from the element.

[![Playwright Tests](https://github.com/bahrus/be-open-and-shut/actions/workflows/CI.yml/badge.svg?branch=baseline)](https://github.com/bahrus/be-open-and-shut/actions/workflows/CI.yml)
[![NPM version](https://badge.fury.io/js/be-open-and-shut.png)](http://badge.fury.io/js/be-open-and-shut)

Size of package, including custom element behavior framework (be-enhanced):

[![How big is this package in your project?](https://img.shields.io/bundlephobia/minzip/be-open-and-shut?style=for-the-badge)](https://bundlephobia.com/result?p=be-open-and-shut)

Size of new code in this package:

<img src="http://img.badgesize.io/https://cdn.jsdelivr.net/npm/be-open-and-shut?compression=gzip">


```html
<side-nav be-open-and-shut>
    <menu >
        ...
    </menu>
</side-nav>
```

is shorthand for

```html
<side-nav be-open-and-shut='{
        "set": "open",
        "onClosest": "*",
        "toVal": false,
        "when": "document",
        "is": "click",
        "outsideClosest": "*"
    }'>
    <menu >
        ...
    </menu>
</side-nav>
```

Technically, this only adds the event handler to the global document object when the value of the property doesn't match the value of "toVal", and the event handler is aborted when it matches.  This allows for a huge number of open-and-shut elements to be active without burdening the global document object with lots of click handlers (typically only one will be active at any one time).

We are assuming the property "open" has a standard setter which can be subscribed to.

Some components, like the native details element, don't consistently call the "open" property setter when the value of open changes.

To accommodate such components, add an alternative event listener on the adorned element to monitor for:

```html
<details be-open-and-shut=toggle>
    <summary>test</summary>
</side-nav>
```

which is short-hand for:

```html
<details be-open-and-shut='{
        "set": "open",
        "onClosest": "*",
        "toVal": false,
        "when": "document",
        "is": "click",
        "outsideClosest": "*",
        "onEventType": "toggle"
    }'>
    <summary>test</summary>
</side-nav>
```

## Hemingway notation [TODO]

```html
<details be-open-and-shut='
    On toggle event of adorned element spring to action.
    Said action attaches to document an event listener with event type click.
    Said event listener does a check to see if event was triggered on an element outside closest *.
    If said check is satisfied set property open to false of closest * of adorned element.
'>
    <summary>test</summary>
</side-nav>
```


There is special logic for the dialog element, which doesn't come close to following this pattern.  H/t on the [implementation](https://stackoverflow.com/questions/50037663/how-to-close-a-native-html-dialog-when-clicking-outside-with-javascript) and for [making me think about this scenario](https://twitter.com/diegohaz/status/1591951471691845632).

```html
<dialog id=dialog be-open-and-shut>
        This is the dialog
</dialog>
<button onclick='openDialog()'>test</button>
<script>
    function openDialog(){
        dialog.showModal();
    }
    
</script>
```

## Viewing Locally

1.  Install git.
2.  Fork/clone this repo.
3.  Install node.
4.  Open command window to folder where you cloned this repo.
5.  > npm install
6.  > npm run serve
7.  Open http://localhost:3030/demo in a modern browser.

## Importing in ES Modules:

```JavaScript
import 'be-open-and-shut/be-open-and-shut.js';


## Using from CDN:

```html
<script type=module crossorigin=anonymous>
    import 'https://esm.run/be-open-and-shut';
</script>
```

