# wc-2048: Tile game in web components

This is a rewrite from scratch without
consulting the original code (except in two cases
noted below) of 2048 entirely using
Web Components, Shadow DOM, and (mostly)
lit/lit-element.

Styles were borrowed from Gabriele Cirulli's
original.

## Author

Michael Scott Asato Cuthbert
(MIT Associate Professor)

cuthbert@post.harvard.edu

http://www.trecento.com/

## Motivation

I wanted to see if an older web app could
be replicated quickly using web components
and modern styling techniques.

## Differences from the original

* no ads.  :-)
* no feedback/bitcoin requested
* drop support for pre-ES6 browsers (necessary for 
web components without polyfills)
* millions fewer users :-(

## When was the source consulted

I could not remember how often you started
with a "4" rather than a "2" -- I thought that
maybe it had to do with the highest number
on the board or how many tiles were empty 
(nope -- it just seems like 
that because it makes a bigger impact on
the game).

When I had finished the clone, and I looked
through the code, I noticed
that WASD were also accepted as input
controls, so I added them. (Also noticed
that the version of 2048 on 
https://play2048.co differs from what is
found on the GitHub repo).

## Known Differences

I didn't bother to implement any of the
buggy tools that would let me change the
instructions from "keyboard" to "swipe"
until the first touch is received.  It seemed
too inconsequential.  The message changes on
first touch.

## Lessons learned

As you can read everywhere, Web Components
are a collection of "related technologies".
These technologies began with the (obsolete)
ShadowDOM v0 and continue to the more robust
technologies used today (v1) upon which, Lit
(lit-html, lit-element), are built.

I believe that linking these technologies
together so closely has been a mistake.

Custom Elements are very helpful.  Shadow DOM
is likewise.  CSS/Style encapsulation is also.
And lit-element's manipulation of the 
DOM without needing to think about it is
also great.

Linking Shadow DOM to CSS encapsulation is
the main problem point here.  Moving from
a major project using Custom Elements and
Lit (mostly) without Shadow DOM
(https://www.artusimusic.com) to one where
every element uses Shadow showed what a
pain the CSS encapsulation can be. (When
the point of the elements is not to be
reusable in other projects. That the
specs were made by large companies could
explain a possible short-sightedness here.)

The basic ways of defining styles either
by putting them in the Shadow's `.innerHTML`
(native Custom Elements) or in a
`static styles = css...`
(or `static get styles() {...return css...})`)
means that site styles are defined repeatedly,
and until loading in a browser it is extremely
difficult to know what style will be applied.

Furthermore, all the tools and ecosystem
designed around making CSS easy (SASS, 
JetBrains' CSS editors) disappear because
you can't load SASS/SCSS/etc. into the
elements without another infrastructure layer,
and while writing, no auto-complete or
CSS checking is performed.  It is possible
to load the CSS in other ways, but you're
going to get a Flash of Unstyled Content (FOUC)
unless you set up the component to load with
`display: none` or `opacity: 0` and then
switch to a different style after all documents
have loaded, which is just
another chore to think about.  And trying
to load via JS/TS/Webpack loaders systems that
require internet resources (such as webfonts
or deriving from Bootstrap via CDN) is a mess.

The `adoptedStyleSheets` and CSS parts
promise to help some aspects of this problem, 
but as long
as Safari (and especially iOS Safari) does
not support this standard, there's not much
to do.  (Safari support was a given from
the get go.)

If I were to rewrite the project, I would
use regular DOM throughout.  But then
I would need to consider more carefully
the use of Lit since we'd be manipulating
the inner DOM of elements a lot for without
telling outer elements.

None of this would be necessary if the
inclusion of Shadow DOM could be separable
from the concept of CSS/Style encapsulation.
Why must the two be coupled with each other
is a part of the Web Components infrastructure?
That has never been explained satisfactorily
to me.

As it was, there was one major place where
Lit/lit-element simply could not work with
the app.  The grid component that manages
tile positions seemed to have to be a
"regular" web component/`extends HTMLElement`
since tiles move around so much, and I did
not want to create classes for each
`translate()` position.  Lit would have
considered a tile that is removed as a
tag that can be reused for a tile in another
position, but that would have prevented the
CSS3 transitions from firing.  A tile which
has translated to 0,0 cannot be replaced
by a tile that appears at 3,3 since we
do not what it to move from one place to
another.  A flaw of the Lit project was
not considering the importance of
transitions from the beginning.  In
Artusi we have set up a whole suite of
transition events, classes, and holders,
to manage Lit so that it does not reuse
a component that needs to transition out,
when we want to add one transitioning in.
A `beforeRemove` and/or `elementChanged`
life-cycle event passing not changedProperties 
but individual elements would solve these
problems.

As it was, time to completion was
approximately:

* 4 hours: app to full functionality, 
  from scratch, including move and fade transitions
* 12 hours: css styling from an existing stylesheet

Clearly, there is a huge opportunity for making
CSS more natural in web components if wider
adaption is important.
