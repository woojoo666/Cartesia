CS174A Final Project: Ikuzo
---------------------------

Created by Max Woo, Kalin Khemka, Vishvanand Subramanian, and Aravind Vadali

Ikuzo is a 3D-style fighting game set on a zombie-infested planet. Armed with nothing more than your sword, you fight and defend yourself against waves of zombies.

### Game Controls

* Up, down arrow keys to move forward and backward
* Left, right arrow keys to turn left and right
* 'Q' key to do a normal attack
* 'W' key to do a special attack
* 'E' key to jump

### Features

* Models for the entire world, including mountains, a river, trees, a lighthouse, and even Royce Hall
* Models for characters, enemies, and weapons
* Framework to place all models given as vertex sets into the world as drawn objects
* Framework to create and draw objects long with their transformations and movements. This framework implements a heirarchical scene-graph style architecture
* Physics to detect collisions between different kinds of objects and gravity to implement jumping and falling. Bounding spheres were used for most collision detection, since most of our objects were easy to represent as spheres
* Texture Map to add a purple gradient background to give a starry-night feel to the game
* Lighting source to light up one half of the planet more than the other, to give a darker, eerie feel to the dark side
* Flat shading on everything for aesthetic appeal
* Multiple animations for different kinds of attacks
* Start screen where camera pans around the planet, before the game starts

### Advanced Topics

* Scene-graph structure
* Physics and collisions
* Transparent textures

Note: In order to see the textures, you will need to serve the directory (a simple way of doing this is using "python -m SimpleHTTPServer" for python 2.* and "python -m http.server" for python 3.*)
