(function() {
    'use strict';

    angular
        .module('app.widgets')
        .directive('threeJs3d', TDirective);

    TDirective.$inject = ['OHService', '$ocLazyLoad', '$timeout', '$uibModal', '$templateCache'];
    function TDirective(OHService, $ocLazyLoad, $timeout, $uibModal, $templateCache) {
        
        var directive = {
            link: link,
            restrict: 'EA',
            template:   
                '<div id="popup" class="popup">' +
                    '<round-slider id="rsl" value="50" arclength="90" startangle="135" handleSize="15"></round-slider>' +
                    '<div id="popupcontent" style="float: left;">' +
                        '<p>Zimmer</p>' +
                        '<p><strong><span id="value">50</span></strong><p>' +
                        '<p>Typ</p>' +
                    '</div>' +
                    '<div class="dropdown">' +
                        '<button class="dropbtn">Modus</button>' +
                        '<div class="dropdown-content">' +
                        '<option value="AUTOMATIC">AUTOMATIC</option>' +
                        '<option value="MANUAL">MANUAL</option>' +
                        '<option value= "BOOST">BOOST</option>' + 
                        '<option value="OFF">OFF</option>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div id="container">' + 
                    '<div class="swibu">' +
                        '<span class="swibuactive"></span>' +
                        '<button class="swibu-case left swibuactive-case">Licht</button>' +
                        '<button class="swibu-case right">Heizung</button>' +
                    '</div>' +
                '</div>',
            scope: {}
        };
        return directive;

        function link($scope, element, attrs) {
    
            $ocLazyLoad.load([
                    '/static/three/jquery-3.4.1.min.js',
                    '/static/three/three.js',
                    '/static/three/OrbitControls.js',  
                    '/static/three/GLTFLoader.js',
                    '/static/three/dat.gui.js',
                    '/static/three/round-slider.js',
                    '/static/three/suncalc.js',
                    '/static/three/Sky.js',
                    '/static/three/CSS2DRenderer.js',
                    '/static/three/RectAreaLightUniformsLib.js',
              ], { serie: true })
            .then (function () {
                $timeout(
                    function (e) { 
                        showthree($scope);
                    }, 200);
            });
            ;
        }

        function showthree(scope){
  
        THREE.Cache.enabled = true;
        var camera, scene, renderer, raycaster, controls, labelRenderer;

        var mouse = new THREE.Vector2(), INTERSECTED;
        var mousepos = new THREE.Vector2();

        var box_lights = new THREE.Group();
        var box_rooms = new THREE.Group();
        var box_windows = new THREE.Group();

        var bulbMat, ambilight, dirlight;

        var clicked;

        var params_man = {
            controls: true,
            time: 'xx:xx:xx',
            Licht_Room1_Status: -2,
            Licht_Room2_Status: -2,
            Licht_Room3_Status: -2,
            Licht_Room6_Status: -2,
            TempIst_Room1: 0,
            TempIst_Room2: 0,
        };

        var p_rooms = {
            Room1:       {geom: [ 4.76, 2.5, 2.6 ], pos: [ 2.38, 1.25, 1.3 ],  layer: 0},
            Room2:       {geom: [ 5.3, 2.5,  3.0 ], pos: [ 7.35, 1.25, 3.5 ],  layer: 0},
            Room3:       {geom: [ 4.76, 2.5, 2.4 ], pos: [ 2.38, 1.25, 3.8 ],  layer: 0},
            Stairs:      {geom: [ 2.0, 2.5, 2.0 ],  pos: [ 8.85, 1.25, 1.2 ],  layer: 0},
            Room4:       {geom: [ 2.7, 2.5, 5.0 ],  pos: [ 1.35, 3.75, 2.5 ],  layer: 1},
            Room5:       {geom: [ 3.0, 2.5, 3.5 ],  pos: [ 4.25, 3.75, 1.8 ],  layer: 1},
            Room6:       {geom: [ 1.8, 2.5, 3.5 ],  pos: [ 6.76, 3.75, 1.8 ],  layer: 1},
            Stairs2:     {geom: [ 2.0, 2.5, 2.0 ],  pos: [ 8.85, 3.75, 1.2 ],  layer: 1},
              
        };

        var p_lights = {
            Room1:      {  color: 0xffee88, pos: [ 2.62, 2.2, 1.44 ], layer: 2,
                            item: scope.$root.items.find(x => x.name === 'item1') || {state: 0}, 
                            switch: scope.$root.items.find(x => x.name === 'item1_switch' )  || {state: 'ONLINE'}},
            Room2:      {  color: 0xffee88, pos: [ 7.5,2.2,3.0 ], layer: 2,
                            item: scope.$root.items.find(x => x.name === 'item2') || {state: 0}, 
                            switch: scope.$root.items.find(x => x.name === 'item2_switch' )  || {state: 'ONLINE'}},
            Room3:      {  color: 0xffee88, pos: [ 2.66,2.2,3.46 ], layer: 2,
                            item: scope.$root.items.find(x => x.name === 'item3') || {state: 0}, 
                            switch: scope.$root.items.find(x => x.name === 'item3_switch' )  || {state: 'ONLINE'}},
            Room6:      {  color: 0xffee88, pos: [ 6.76, 4.7, 1.8 ], layer: 3,
                            item: scope.$root.items.find(x => x.name === 'item6') || {state: 0},
                            switch: scope.$root.items.find(x => x.name === 'item6_switch' )  || {state: 'ONLINE'}},                           
        };


        var p_temp = {
            Room1:        {    actual: scope.$root.items.find(x => x.name === 'item1_temp_ist' ) || {state: '0 °C'},
                                setting: scope.$root.items.find(x => x.name === 'item1_temp_soll' ) || {state: '12 °C'},
                                mode: scope.$root.items.find(x => x.name === 'item1_temp_mode' ) || {state: 'AUTOMATIC'}, 
                                layer: 0},
            Room2:        {    actual: scope.$root.items.find(x => x.name === 'item2_temp_ist' ) || {state: '25 °C'},
                                setting: scope.$root.items.find(x => x.name === 'item2_temp_soll' ) || {state: '12 °C'},
                                mode: scope.$root.items.find(x => x.name === 'item2_temp_mode' ) || {state: 'AUTOMATIC'}, 
                                layer: 0},
        };


        var p_windows = {
            Room2:        {    contact: scope.$root.items.find(x => x.name === 'item2_window_switch' ) || {state: 'OPEN'},
                                pos: [ 3.62, 1.5, 4.97 ], rot: 0, dim: [0.91, 1.34], layer: 0},
        };


        var containerwidth = window.innerWidth-$(container).parent().offset().left;
        var containerheight = window.innerHeight-$(container).parent().offset().top;

        var activeElement = 'none';
        var activeDropdown = 'none';
        var activeDomain = 0;
        var activeFloor = 0;

        var switchButton            = document.querySelector('.swibu');
        var switchBtnRight          = document.querySelector('.swibu-case.right');
        var switchBtnLeft           = document.querySelector('.swibu-case.left');
        var activeSwitch            = document.querySelector('.swibuactive');
        $("#popup").hide();
        $(".dropdown").hide();

        var OG = new THREE.Group();
        var EG = new THREE.Group();
        var transplane;


        function switchLeft(){
            switchBtnRight.classList.remove('swibuactive-case');
            switchBtnLeft.classList.add('swibuactive-case');
            activeSwitch.style.left                         = '0%';
            activeDomain = 0;
            $('#rsl').attr({"min" : "0","max" : "100","step": "1"});
            $('.annotation').css('visibility', 'hidden');
            $(".dropdown").hide();
            box_windows.visible = false;
            render();
        }

        function switchRight(){
            switchBtnRight.classList.add('swibuactive-case');
            switchBtnLeft.classList.remove('swibuactive-case');
            activeSwitch.style.left                         = '50%';
            activeDomain = 1;
            $('#rsl').attr({"min" : "4.5","max" : "30","step": "0.5"});
            $('.annotation').css('visibility', 'visible');
            $(".dropdown").show();
            box_windows.visible = true;
            render();
        }

        switchBtnLeft.addEventListener('click', function(){
            switchLeft();
        }, false);

        switchBtnRight.addEventListener('click', function(){
            switchRight();
        }, false);


        document.querySelectorAll("round-slider").forEach(function (el) {
            el.addEventListener('value-changed', function(ev) {
              if(ev.detail.value !== undefined)
                if (ev.detail.value > ( ev.srcElement.max - ev.srcElement.min) * 0.9  + ev.srcElement.min ){
                    sendSlider(activeElement, ev.srcElement.max);
                    setValue(ev.srcElement.max, false);
                }
                else if (ev.detail.value < ( ev.srcElement.max - ev.srcElement.min) * 0.1 + ev.srcElement.min ) {
                    sendSlider(activeElement, ev.srcElement.min);
                    setValue(ev.srcElement.min, false);
                }
                else {                        
                    setValue(ev.detail.value, false);
                    sendSlider(activeElement, ev.detail.value);
                }
              else if(ev.detail.low !== undefined) {
                setLow(ev.detail.low, false);
                sendSlider(activeElement, ev.detail.low);    
              }
              else if(ev.detail.high !== undefined) {
                setHigh(ev.detail.high, false);
                sendSlider(activeElement, ev.detail.high);
              }
            });

            el.addEventListener('value-changing', function(ev) {
              if(ev.detail.value !== undefined)
                setValue(ev.detail.value, true);
              else if(ev.detail.low !== undefined)
                setLow(ev.detail.low, true);
              else if(ev.detail.high !== undefined)
                setHigh(ev.detail.high, true);
            });
        });

         $(document).mouseup(function (e) {
             var popup = $("#popup");
             if (!popup.is(e.target) && popup.has(e.target).length == 0) {
                 popup.hide();
                 activeElement = 'none';
             }
         });

        
        $('.dropdown').on('click', function(e) {
            if (activeDropdown != 'none') {
                if (e.target.value == 'OFF') {
                    OHService.sendCmd(activeDropdown, 'MANUAL')
                    OHService.sendCmd(activeElement, '4.5');  
                }
                else
                    OHService.sendCmd(activeDropdown, e.target.value);
                render();            
            }
        });



          const setValue = function(value, active) {
            document.querySelectorAll("round-slider").forEach(function(el) {
              el.value = value;
            });
            const span = document.querySelector("#value");
             span.innerHTML = value;
            if(active)
              span.style.color = 'red';
            else
              span.style.color = 'white';
          }
          const setLow = function(value, active) {
            document.querySelectorAll("round-slider").forEach(function(el) {
//              if(!el.low) return;
              el.low = value;
            });
            const span = document.querySelector("#low");
             span.innerHTML = value;
            if(active)
              span.style.color = 'red';
            else
              span.style.color = 'white';
          }
          const setHigh = function(value, active) {
            document.querySelectorAll("round-slider").forEach(function(el) {
//              if(!el.high) return;
              el.high = value;
            });
            const span = document.querySelector("#high");
             span.innerHTML = value;
            if(active)
              span.style.color = 'red';
            else
              span.style.color = 'white';
          }

        function lerpColor(a, b, amount) { 
            var ah = parseInt(a.replace(/#/g, ''), 16),
                ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
                bh = parseInt(b.replace(/#/g, ''), 16),
                br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
                rr = ar + amount * (br - ar),
                rg = ag + amount * (bg - ag),
                rb = ab + amount * (bb - ab);
            return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
        }

        if($('#container').is(':visible')) {
            init();
            animate();
        }       
 
        function init() {
            
            // CAMERA
            camera = new THREE.PerspectiveCamera( 60, containerwidth / containerheight, 0.1, 100 );
            camera.position.set(4.34,16.5,9.3);
            camera.layers.enable( 2 ); 

            var resetview = { add:function(){ camera.position.set(4.34,16.5,9.3) }};


            // SCENE
            scene = new THREE.Scene();

            // RAYCASTER
            raycaster = new THREE.Raycaster();

            // RENDERER
            renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
            renderer.physicallyCorrectLights = true;
            renderer.gammaFactor = 2.2;
            renderer.outputEncoding = THREE.sRGBEncoding;
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.BasicShadowMap; 
            renderer.toneMapping = THREE.Uncharted2ToneMapping;
            renderer.toneMappingExposure = 0.8;
            renderer.setPixelRatio( window.devicePixelRatio );
            renderer.setSize( containerwidth, containerheight );
            renderer.setClearColor(0x000000, 0.0);
            container.appendChild( renderer.domElement );


            labelRenderer = new THREE.CSS2DRenderer();
            labelRenderer.setSize( containerwidth, containerheight );
            labelRenderer.domElement.style.position = 'absolute';
            labelRenderer.domElement.style.top = 0;
            container.appendChild( labelRenderer.domElement );

            // CONTROLS
            controls = new THREE.OrbitControls( camera, labelRenderer.domElement );
            controls.target = (new THREE.Vector3(4.34,0,4.6));
            controls.minDistance = 10;
            controls.maxDistance = 50;
            controls.maxPolarAngle = Math.PI*0.45;
            controls.update();

            // Sky
            dirlight = new THREE.DirectionalLight(0xffffff, 1); //DirectionalLight( 0xffd28f, 1 );
            scene.add( dirlight );

            ambilight = new THREE.AmbientLight( 0xffffff, 0 );
            scene.add( ambilight );

            var light = new THREE.PointLight( 0xffffff, 2, 0 );
            light.position.set(0, 1, 100 );
            scene.add( light );

            light = new THREE.PointLight( 0xffffff, 2, 0 );
            light.position.set(0, 1, -100 );
            scene.add( light );

            light = new THREE.PointLight( 0xffffff, 2, 0 );
            light.position.set( 100, 1, 0 );
            scene.add( light );

            light = new THREE.PointLight( 0xffffff, 2, 0 );
            light.position.set(-100, 1, 0 );
            scene.add( light );

            initSky();





            // LOADER
            const manager = new THREE.LoadingManager()
            manager.onLoad = function ( ) {
                console.log( "Loading complete!")
                render();
            }
            manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
                console.log(`Items loaded: ${itemsLoaded}/${itemsTotal}`)
            }
            manager.onError = function ( url ) {
                console.log( 'There was an error loading ' + url )
            }

            var loader = new THREE.GLTFLoader(manager); 
            loader.load( '/static/three/EG.glb', function ( gltf ) {
                EG = gltf.scene;
                EG.traverse( function ( child ) {
                    if ( child instanceof THREE.Mesh ) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                    if (child.material == undefined)
                        return; 
                    if (child.material.name.includes("window") || child.material.name.includes("glass") || child.material.name.includes("flltgrey") ) {
                        child.castShadow = false;
                        child.recieveShadow = false;
                    }
                });
                EG.scale.set(0.01,0.01,0.01);
                EG.name = 'EG';
                scene.add( EG );
                render();

            } );


            var loader = new THREE.GLTFLoader(manager); 
            loader.load( '/static/three/OG.glb', function ( gltf ) {
                OG = gltf.scene; 
                OG.traverse( function ( child ) {
                    if ( child instanceof THREE.Mesh ) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        child.layers.set( 1 );
                    }                       
                    if (child.material == undefined)
                        return; 
                    if (child.material.name.includes("window") || child.material.name.includes("glass") || child.material.name.includes("flltgrey") ) {
                        child.castShadow = false;
                        child.recieveShadow = false;
                    }
                });
                OG.scale.set(0.01,0.01,0.01);
                OG.name = 'OG';
                scene.add( OG );
                render();

            } );

            var geometry = new THREE.PlaneGeometry( 50, 50, 50 );
            var material = new THREE.MeshBasicMaterial( {
                color: 0x000000, 
                opacity: 0.5,
                transparent: true});
            transplane = new THREE.Mesh( geometry, material );
            transplane.rotation.x = -Math.PI/2;
            transplane.position.y = 2.51;
            transplane.layers.set( 1 );
            scene.add( transplane );


            // LIGHT
            box_lights.name = "box_lights";
            Object.entries(p_lights).forEach(([p_light_name, p_light_val]) => {
                var light = new THREE.PointLight( p_light_val.color, 1, 8, 2 ); 
                light.position.set( p_light_val.pos[0], p_light_val.pos[1], p_light_val.pos[2] );
                light.castShadow = true;
                light.power = p_light_val.item.state * 2;
                light.name = p_light_name;
                light.layers.set( p_light_val.layer );
                light.shadow.bias = -0.0001;

                box_lights.add( light );
            });                
            scene.add( box_lights );

            // ROOMS
            box_rooms.name = "box_rooms";
            Object.entries(p_rooms).forEach(([p_room_name, p_room_val]) => {
                var geometry = new THREE.BoxBufferGeometry( p_room_val.geom[0], p_room_val.geom[1], p_room_val.geom[2] );
                var material = new THREE.MeshPhongMaterial({
                    color: 0x711091,
                    opacity: 0,
                    transparent: true,});
                var mesh = new THREE.Mesh( geometry, material );
                mesh.position.set( p_room_val.pos[0], p_room_val.pos[1], p_room_val.pos[2] );
                mesh.name = p_room_name;
                mesh.layers.set( p_room_val.layer );
                box_rooms.add( mesh );
            });                
            scene.add( box_rooms );

            // TEMP
            Object.entries(p_temp).forEach(([p_temp_name, p_temp_val]) => {
                var room = box_rooms.children.find( x => x.name === p_temp_name);
                if (room == undefined)
                    return; 
                var divlabel = document.createElement( 'div' );
                divlabel.className = 'annotation';
                divlabel.id = 'templabel_' + p_temp_name;
                divlabel.textContent = p_temp_val.actual.state;
                divlabel.style.marginTop = '-1em';
                var templabel = new THREE.CSS2DObject( divlabel );
                templabel.layers.set( p_temp_val.layer );
                room.add( templabel );
            });

            // WINDOWS
            THREE.RectAreaLightUniformsLib.init();
            box_windows.name = "box_windows";
            Object.entries(p_windows).forEach(([p_window_name, p_window_val]) => {
                var rectLight;
                rectLight = new THREE.RectAreaLight( 0xf5ff00, 2, p_window_val.dim[0], p_window_val.dim[1] ); //0x00ff00
                rectLight.position.set( p_window_val.pos[0], p_window_val.pos[1], p_window_val.pos[2] );
                rectLight.rotation.y = p_window_val.rot;
                rectLight.name = p_window_name;
                rectLight.visible = false;
                rectLight.layers.set( p_window_val.layer);

                var rectLightMesh = new THREE.Mesh( new THREE.PlaneBufferGeometry(), new THREE.MeshBasicMaterial( { side: THREE.DoubleSide } ) );
                rectLightMesh.scale.x = rectLight.width+.5;
                rectLightMesh.scale.y = rectLight.height+.5;
                rectLightMesh.material.opacity = 0.3;
                rectLightMesh.material.transparent = true;
                rectLightMesh.material.color.setHex(0xf5ff00);
                rectLight.add( rectLightMesh );

                box_windows.add( rectLight );
            });                
            scene.add( box_windows );
    
            // LISTENER
            window.addEventListener( 'resize', onWindowResize, false );
            document.addEventListener( 'mousemove', onDocumentMouseMove, false );
            document.addEventListener( 'touchstart', onDocumentTouchStart, false );
            window.addEventListener( 'mousedown', onWindowMouseDown, false);

            // GUT
            var gui = new dat.GUI();
            gui.add( resetview, 'add' ).name('Reset Camera');
            gui.add( params_man, 'controls');
            gui.add( params_man, 'time').onChange(initSky);
            gui.add( params_man, 'Licht_Room1_Status', -2, 100 );
            gui.add( params_man, 'Licht_Room2_Status', -2, 100 );
            gui.add( params_man, 'Licht_Room3_Status', -2, 100 );
            gui.add( params_man, 'Licht_Room6_Status', -2, 100 );
            gui.add( params_man, 'TempIst_Room1', 0, 35 );
            gui.add( params_man, 'TempIst_Room2', 0, 35 );
            gui.close();

        }



    function initSky() {
        var lat = 47.642676;
        var long = 9.393985;
        var ele = 100; 

        var d = Date.now();
        if (params_man.time != 'xx:xx:xx') {
            d = new Date('04/19/2020 ' + params_man.time);
            d = d.getTime();
        }

        var sc = SunCalc.getTimes(d, lat, long);
        
        var sunPos = SunCalc.getPosition(d, lat, long, ele);
        var inclination = sunPos.altitude-Math.PI/2;
        var azimuth = sunPos.azimuth;

        // Add Sky
        var sky = new THREE.Sky();
        sky.scale.setScalar( 450000 );
        scene.add( sky );

        // Add Sun Helper
        var sunSphere = new THREE.Mesh(
          new THREE.SphereBufferGeometry( 20000, 16, 8 ),
          new THREE.MeshBasicMaterial( { color: 0xffffff } )
        );
        sunSphere.position.y = - 700000;
        scene.add( sunSphere );

        var distance = 400000;
        var uniforms = sky.material.uniforms;
        uniforms.turbidity.value = 10;
        uniforms.rayleigh.value = 0.642;
        uniforms.luminance.value = 0.9;
        uniforms.mieCoefficient.value = 0.005;
        uniforms.mieDirectionalG.value = 0.9;

        sunSphere.position.setFromSphericalCoords(distance, inclination, azimuth);
        uniforms.sunPosition.value.copy( sunSphere.position );

        if ((d > sc.sunrise & d < sc.goldenHourEnd) | (d > sc.goldenHour & d < sc.sunset)) {
            dirlight.position.copy( sunSphere.position );
            dirlight.color.setHex(0xe9ce5d);
            dirlight.intensity = 1;
            ambilight.intensity = 0.2;
        }
        else if ((d > sc.sunset | d < sc.sunrise)) {
            dirlight.position.set(0,1,0)
            dirlight.color.setHex(0xffd28f);
            dirlight.intensity = 0.05;
            ambilight.intensity = 0;
        }
        else {
            switchRight();
            dirlight.position.copy( sunSphere.position );
            dirlight.color.setHex(0xffffff);
            dirlight.intensity = 1;
            ambilight.intensity = 0.1;
        }
    }   


        function onWindowResize() {
            containerwidth = window.innerWidth-$(container).parent().offset().left;
            containerheight = window.innerHeight-$(container).parent().offset().top;

            camera.aspect = containerwidth / containerheight;
            camera.updateProjectionMatrix();
            renderer.setSize(containerwidth, containerheight);
        }

        function onWindowMouseDown() {
            clicked = true;
        }

        function onDocumentMouseMove( event ) {
            if($('#container').is(':visible')) {
                event.preventDefault();
                var parentOffset = $(container).parent().offset(); 
                mouse.x = ( (event.clientX - parentOffset.left) / containerwidth ) * 2 - 1;
                mouse.y = - ( (event.clientY - parentOffset.top) / containerheight ) * 2 + 1;
                mousepos.x = event.clientX;
                mousepos.y = event.clientY;
            }
        }

        function onDocumentTouchStart( event ) {
            if($('#container').is(':visible')) {
                clicked = true;
                var parentOffset = $(container).parent().offset(); 
                mouse.x = ( (event.clientX - parentOffset.left) / containerwidth ) * 2 - 1;
                mouse.y = - ( (event.clientY - parentOffset.top) / containerheight ) * 2 + 1;
                mousepos.x = event.clientX;
                mousepos.y = event.clientY;
            }
        }

        function movePopup() {
            var x = Math.max(mousepos.x,100); 
                x = Math.min(x, $(window).width()-100);
            var y = Math.max(mousepos.y,100);
                y = Math.min(y, $(window).width())
                $(".popup").css("left", x);
                $(".popup").css("top", y);
        };


        // ANIMATE
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            if (activeDomain == 0){
                updateLights();
            }
            else {
                updateTemp();
            }
            updateRaycaster();
            if (!$('.popup').is(':visible')) {
                render();   
            }
        }

        function render() {
            renderer.render(scene, camera);
            labelRenderer.render( scene, camera );
        }




        function updateLights() {
            $('.annotation').css('visibility', 'hidden');
            box_lights.children.forEach(function(light) {
                light.color.setHex(p_lights[light.name].color);
                light.power = p_lights[light.name].item.state *2;
            });


            box_rooms.children.forEach(function(room) {
                var light = box_lights.children.find( x => x.name === room.name);


                if (light == undefined) {
                    if ( INTERSECTED != room)
                        room.material.opacity = 0;
                    return; 
                }
        
                if (INTERSECTED == room & !$('.popup').is(':visible')) {

                    movePopup();
                    document.getElementById("popupcontent").innerHTML = "<p>" + room.name + "</p><p><strong><span id='value'></span></strong><p><p>Licht</p>";
                    if (p_lights[room.name].switch.state == 'ONLINE')
                        setValue(p_lights[room.name].item.state, false);
                    else {
                        setValue(0, false);
                        document.getElementById("popupcontent").innerHTML = "<p>" + room.name + "</p><p><strong>OFFLINE</strong><p><p>Licht</p>";
                    }

                    $('#popup').show();
                    activeElement = room.name +'_Licht';
                }


                if ( INTERSECTED != room) {
                    var manual = params_man['Licht_' + room.name + '_Status'];

                    if (p_lights[room.name].switch.state == 'OFFLINE' & manual == -2) {
                        light.power = 0;
                        room.material.emissive.setHex( 0x303030 ); //
                        room.material.opacity = 0.5;
                    }
                    else if ( manual == -1) {
                        light.power = 0;
                        room.material.emissive.setHex( 0x303030 );
                        room.material.opacity = 0.2;
                    }
                    else {
                        if (manual == -2) {
                            light.power = p_lights[light.name].item.state *2;
                        } 
                        else {
                            light.power = manual *2;
                        }
                        room.material.emissive.setHex( 0x711091 );
                        room.material.opacity = 0;
                    }

                }
            });
        }

        function updateTemp() {

            box_rooms.children.forEach(function(room) {
                var light = box_lights.children.find( x => x.name === room.name);
                var TempIst_man = params_man['TempIst_' + room.name];

                if (p_temp[room.name] == undefined)
                    return;

                if (INTERSECTED == room & !$('.popup').is(':visible')) {
                    movePopup();
                    document.getElementById("popupcontent").innerHTML = "<p>" + room.name + "</p><p><strong><span id='value'></span></strong><p><p> " + p_temp[room.name].actual.state + "</p>";
                    $(".dropbtn").text(p_temp[room.name].mode.state);
                    if (Number(p_temp[room.name].setting.state.match(/^\d*\.?\d*/)[0]) != 'NaN')
                        setValue(Number(p_temp[room.name].setting.state.match(/^\d*\.?\d*/)[0]), false);
                    else {
                        setValue(0, false);
                        document.getElementById("popupcontent").innerHTML = "<p>" + room.name + "</p><p><strong>OFFLINE</strong><p><p>Heizung</p>";
                    }
                    $('#popup').show();
                    activeElement = room.name +'_Thermostat_Soll';
                    activeDropdown = room.name + '_Thermostat_Modus';
                }

                if ( INTERSECTED != room) { 
                    if (TempIst_man == 0) {
                        var percCol = Math.min(Math.max((p_temp[room.name].actual.state.match(/^\d*\.?\d*/)[0] - 15) / 12,0),1);
                        var col = lerpColor('#0d2261', '#ff0000', percCol);
                    }
                    else {
                        var percCol = Math.min(Math.max((TempIst_man - 15) / 12,0),1);
                        var col = lerpColor('#0d2261', '#ff0000', percCol);
                    }
                    room.material.emissive.setStyle(col);
                    room.material.opacity = .5;
        
                    if (light != undefined) {
                        light.power = 100;
                        light.color.setStyle(col)
                    }
                }
            });

            Object.entries(p_temp).forEach(([p_temp_name, p_temp_val]) => {
                var room = box_rooms.children.find( x => x.name === p_temp_name);
                if (p_temp_val.layer == activeFloor)
                    $ ( "#templabel_" + p_temp_name ).css('visibility', 'visible');
                else {
                    $ ( "#templabel_" + p_temp_name ).css('visibility', 'hidden');
                    return;
                }

                $( "#templabel_" + p_temp_name ).html('<p>' + p_temp_val.actual.state + '<br><b>' + p_temp_val.setting.state + '</b></p>' );
                if (p_temp_val.mode.state == "AUTOMATIC")
                    $ ( "#templabel_" + p_temp_name ).css('border-style', 'solid');
                else
                    $ ( "#templabel_" + p_temp_name ).css('border-style', 'hidden');
            });

            box_windows.children.forEach(function(wind) {
                if (p_windows[wind.name].contact.state == 'OPEN' & p_windows[wind.name].layer == activeFloor)
                    wind.visible = true;
                else
                    wind.visible = false;
            });

        }


        function updateRaycaster() {
            if (clicked){
                raycaster.setFromCamera( mouse, camera );
                var intersects = raycaster.intersectObjects( scene.getObjectByName('box_rooms').children, true ); 
                if ( intersects.length > 0 ) {
                    if ( INTERSECTED != intersects[ 0 ].object ) {
                        if ( INTERSECTED ) {
                            INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
                            INTERSECTED.material.opacity = INTERSECTED.currentOpacity;                          
                        }
                        INTERSECTED = intersects[ 0 ].object;
                        INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
                        INTERSECTED.currentOpacity = INTERSECTED.material.opacity;
                        INTERSECTED.material.emissive.setStyle( '#556B2F' );                       
                        INTERSECTED.material.opacity = .5;
                    }
                } else {
                    if ( INTERSECTED ) {
                        INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
                        INTERSECTED.material.opacity = INTERSECTED.currentOpacity;
                    }
                    INTERSECTED = null;
                }
                clicked = false;

                if (INTERSECTED == box_rooms.children.find(x => x.name === 'Stairs' ) | INTERSECTED == box_rooms.children.find(x => x.name === 'Stairs2' )) {
                    if (activeFloor == 0) {   
                        activeFloor = 1;
                        camera.layers.enable( 1 );
                        camera.layers.enable( 3 );

                        camera.layers.disable( 2 );
                        raycaster.layers.set( 1 );

                    }
                    else {   
                        activeFloor = 0;
                        camera.layers.disable( 1 );
                        camera.layers.disable( 3 );

                        camera.layers.enable( 2 ); 

                        raycaster.layers.set( 0 );

                    }
                }
                render();
                }
            }

        function sendSlider(actElement, actValue){
            if (actElement != 'none')
                OHService.sendCmd(actElement, actValue);
                render();            
        }


    }
    }
})();