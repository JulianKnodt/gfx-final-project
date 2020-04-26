# Notes

The steps we need to do are to pass all the vertices into the vertex shader and convert them to
clip space based on our camera's position and also pass the vertex normals.

Then, we can do shading entirely inside of the fragment shader based on the interpolated value
of the normal.

We would need to handle all user interaction in JS before modifying parameters passed to the
shader.

We need to test obj loading.
