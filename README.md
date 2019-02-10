# Project 2

To view this project, open `dist/index.html`.

To build this project, use `npm run build`. The project will build as
`index.html` in `dist`.

To run this project as a local web server, use `npm run dev`. It will be visible
at `http://localhost:1234`.

## Source structure

The following files can be found in the `src` directory.

### `index.html`

This file contains the shader programs.

The vertex shader takes in two attributes: the position and normal of each
vertex. It also takes in four uniform variables: the projection, view, and model
matrices, and a scale for the "explosion" animation.

Besides applying the three transformation matrices, the only operation performed
by the vertex shader is moving each vertex along its normal by an amount
proportional to the uniform explosion scale. This is achieved by multiplying the
normal vector by the scale and adding the result to the vertex's position before
applying any of the transformation matrices.

By computing the effect of the explosion animation in the shader, a minimal
amount of data needs to be set before each screen update.

The fragment shader sets the fragments' colors.

### `main.js`

This is the file that executes the program.

Most of the individual functions are documented in the file.

When the page is loaded, the animation settings are initialized and bound to the
various keyboard controls and UI elements.

#### Mesh setup

When a file is uploaded, if it has the correct format, the previous animation is
cancelled and the file's contents are read into a `Mesh`.

The vertices and normals from the mesh are then bound to the corresponding
variables in the vertex shader, and the mesh is used to set the projection and
view matrices.

The projection matrix is set using a fixed field of view (90 degrees X, 54
degrees Y), aspect ratio (5/3), and near and far planes (0.001 and 1000).

The view matrix is set based on the field of view and the size of the
mesh. Using the fixed field of view, the camera's is located at the X/Y midpoint
of the mesh's bounding box, at 10% more than the smallest distance required to
view the entire bounding box in the fixed field of view.

Once the vertices, normals, and project and view matrices are set, they do not
change until a new file is loaded.

Finally, the animation state object (see the section on `Animations.js`) is
initialzied with default values and the animation is started.

#### Animations

The mesh is redrawn every frame. In this process, the mesh's positions in each
of the four animations is polled and passed to the vertex shadr.

The current position in the explosion animation is passed through an easing
function (to make the animation smooth), then multiplied by the animation's
adjustable magnitude to produce the final explosion scale for the shader.

The current position in the rotation animation is used to construct a rotation
matrix, and the positions in the three axes' translations are used to construct
a translation matrix. These two matrices are multiplied and passed to the shader
as the model matrix.

Then, the program loops over the mesh and redraws each face.

#### Controls and settings

When one of the animation keys is pressed, the action taken depends on the
type of animation.

For the "explosion" and rotation, the animation is toggled on or off.

For the translations, pressing a key always attempts to toggle the movement
along that axis as appropriate (starting if not running, stopping if running, or
reversing direction if running in the opposite direction). If movement along
multiple axes is not allowed, the translations along the other axes are also
stopped.

When the settings sliders and checkbox are used, they update a value in the
program's settings object, which is read by the animations as they occur.

### `Animations.js`

This module contains two classes. `AnimationState` stores the state of this
program's animations, and `AnimationTracker` keeps track of an animation's
position. These classes are documented in the file.

### `Mesh.js`

The `Mesh` class represents a mesh. It stores the mesh as a list of vertices, a
list of normals, and a list of (size, offset) pairs representing the location of
each face in the first two arrays. For example, a face with size 4 and offset 6
would include four vertices (and their normals), starting at the fifth (6 - 1).

This class is constructed using the data from a PLY files: a list of vertices
and an index array for the faces. It duplicates vertices and computes the
normals as necessary when it is created.

An example of this representation is given at the end of this file.

### `Extent.js`

The `Extent` class represents a bounding box of a set of points. Since project
1, I have added getter methods for the midpoint and radius of the bounding box.

### `KeyboardUI.js`

This module contains methods allowing for manipulation of the keyboard keys
shown in the user interface.

### `filereaders.js`

This file contains functions that read and parse the data files.

The functions in this file are documented in the file.

### `MV+.js`

This file is largely a copy of `MV.js`. The style has been improved, and a few
functions have been modified. Notable, `perspective` has been replaced with
`perspectiveDeg` and `perspectiveRad`, which take degrees and radians for field
of view, respectively.

### `webgl-setup.js`

This file contains functions that perform the initial setup for the WebGL
contxt and program. They compile and link the shaders, and display error
messages in the DOM and console if something goes wrong.


## Example mesh

Consider this mesh, represented in a format similar to the PLY files used in
this project:

```
          X  Y  Z
vertex 0: 0, 0, 0
vertex 1: 1, 0, 0
vertex 2: 0, 1, 0
vertex 3: 0, 0, 1

face 1 vertices: 0, 2, 1
face 2 vertices: 0, 3, 2
```

The faces of this mesh are one triangle in the Z plane (with sides on the X and Y axes),
and one in the X plane (with sides on the Y and Z axes).

Each triangle's faces the negative direction, with normal -1 in its plane.

This mesh would be represented in a `Mesh` like this (parentheticals added for
ease of reading):
```
vertices:
   0, 0, 0,  (0: vertex 0, face 1)
   0, 1, 0,  (1: vertex 2, face 1)
   1, 0, 0,  (2: vertex 1, face 1)
   0, 0, 0,  (3: vertex 0, face 2)
   0, 0, 1,  (4: vertex 3, face 2)
   0, 1, 0   (5: vertex 2, face 2)
  
normals:
   0,  0, -1,  (0: vertex 0, face 1)
   0,  0, -1,  (1: vertex 2, face 1)
   0,  0, -1,  (2: vertex 1, face 1)
  -1,  0,  0,  (3: vertex 0, face 2)
  -1,  0,  0,  (4: vertex 3, face 2)
  -1,  0,  0   (5: vertex 2, face 2)
  
faces:
   size offset
  [  3,    0  ],  (face 1)
  [  3,    3  ]   (face 2)
```

Face 1 is represented by the first three vertices and normals in those lists.
Face 2 is represented by three vertices and normals at an offset of three in
those lists.

### Sample PLY

This is the sample shown above, in PLY format.

```
ply
format ascii 1.0
element vertex 4
property float32 x
property float32 y
property float32 z
element face 2
property list uint8 int32 vertex_indices
end_header
0 0 0
1 0 0
0 1 0
0 0 1
3 0 2 1
3 0 3 2
```
