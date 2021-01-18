# habpanel_threejs
Example of a 3D floorplan live renderering in Openhab habpanel.

This is just a quick example of how to implement it in Openhab 2.5 habpanel. Feel free to edit.

## Requires
Put the following files and the included files of this repo in the subfolder \openhab\conf\html\three

- [jquery-3.4.1.min.js](https://jquery.com/) -> https://code.jquery.com/jquery-3.4.1.js
- [three.js](https://threejs.org/)  -> https://unpkg.com/browse/three@0.115.0/
- [OrbitControls.js](https://threejs.org/docs/#examples/en/controls/OrbitControls) -> https://github.com/mrdoob/three.js/blob/master/examples/jsm/controls/OrbitControls.js  
- [GLTFLoader.js](https://threejs.org/docs/#examples/en/loaders/GLTFLoader) -> https://github.com/mrdoob/three.js/blob/master/examples/jsm/loaders/GLTFLoader.js 
- [dat.gui.js](https://github.com/dataarts/dat.gui) -> https://github.com/dataarts/dat.gui/blob/master/build/dat.gui.js
- [Sky.js](https://github.com/loginov-rocks/three-sky) -> https://github.com/mrdoob/three.js/blob/master/examples/js/objects/Sky.js
- [CSS2DRenderer.js](https://threejs.org/docs/#examples/en/renderers/CSS2DRenderer) -> https://github.com/mrdoob/three.js/blob/master/examples/jsm/renderers/CSS2DRenderer.js
- [RectAreaLightUniformsLib.js](https://threejs.org/docs/#api/en/lights/RectAreaLight) -> https://github.com/mrdoob/three.js/blob/master/src/lights/RectAreaLight.js
- round-slider.js  -> https://github.com/thomasloven/round-slider
- suncalc.js    -> https://github.com/mourner/suncalc

## Example House
Sweet Home 3D -> Example 6 
Export as Obj -> Import it in Blender 2.8 -> Export it as GLB

## Implementation
Create a new dashboard in habpanel including a custom widget with the following definition

```html
<link type="text/css" rel="stylesheet" href="/static/three/main.css">
<div oc-lazy-load="'/static/three/T.directive.js'">
	<three-js-3d 
      style="position: absolute; left: 0; right: 0; top: 0; bottom: 0"
      lib-url="/static/three">	
	</three-js-3d>
</div>
```
## Definition of items
Adjust the list of items in the parameters p_lights, p_temp, p_windows
- E.q. 'item1' equals a dimmer object.
- E.q. 'item1_temp_xxx' equals a thermostat (in my case Max! eQ3)
- E.q. 'item2_window_switch' equals a window sensor

## Definition of rooms / lights etc.
Adjust the position and size of the rooms in p_rooms

## Floor
You can move to the 1st Floor and back via p_room 'stairs'

## Demo
You should be able to try a demo without customization of items by changing the values in the dat.gui controler.

## References
- Three.js	   - https://threejs.org/
- SweetHome3D	 - http://www.sweethome3d.com/
- Switchbutton - https://codepen.io/vanderlanth/pen/BoNLvq/
- Round-Slider - https://github.com/thomasloven/round-slider
- WebGL PoC 	 - https://community.openhab.org/t/proof-of-concept-interactive-webgl-view-with-habpanel-sweet-home-3d/32995
- suncalc 	   - https://github.com/mourner/suncalc
- Inspired by  - https://github.com/ghys/habpanel-3dview/blob/master/README.md

