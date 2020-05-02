# Notes on shaders

We probably want to have multiple different kinds of vertex shaders, depending on whether there
is a bump-map or not. We generally do not care about colors because we're converting to black
and white anyway(maybe we can add in colors later).

Normals are a lot more relevant because they determine how we render, so it's very important we
utilize them if we get the chance.
