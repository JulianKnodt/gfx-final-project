<!-- Outline from COS 426 Final Project assignment page -->

# Written Report

Julian Knodt, Eric Tsang

## Abstract
This project implements hardware-accelerated ink wash painting for 3D objects based on the work of [Park et al.](http://www.myeglab.com/Content/sumi_e_painting.pdf) and adapted for the web using ThreeJS and GLSL.

## Introduction
### Goal

Make a non-photo realistic renderer for simulating chinese ink-painting.

#### What did we try to do?

Using prior work on such techniques, implement such a system in GLSL and ThreeJS. Using existing
3D models simulate the ink-strokes and shading of artwork.

#### Who would benefit?

Anyone who appreciates art. This is just a fun project, but if you enjoy ink based it can be considered
an open-source contribution to the community. The main benefactors of this work are people who
might want to explore ink-based rendering.

### Previous Work

There was prior work on realtime "Sumi-e"(chinese ink art) rendering from Hallym Univ. and
Hongik Univ. in South Korea which is what our work is mostly based off. There is also some work
from the Univ. of Macao but we found that work to be exceptionally vague and hard to understand
so while it did contribute to some ideas and general understanding, it did not add anything in
particular.

There is also substantial work on 2D ink renderings, and there was an undergraduate thesis on 2D
bamboo generation, so that inspired 3D bamboo generation in our work.

#### What related work have other people done?

Okami was a commercial game which utilized ink-style rendering. It's unclear how they performed
rendering as there is little to no reference on how Okami performs rasterization.

In addition, all works referenced above say they provide implementations, but they are not
attached to their respective papers. We were also unable to find them via online search, so we
could not access them.

#### When do previous approaches fail/succeed?

As with all kinds of art, there is no one right way to do it so we hope to provide another
interesting visualization with different artistic style. Of course, there is better and worse
simulation of real ink-strokes, but it is not within our capacity to look at such projects and
immediately realize how we can better simulate such things.

### Approach
####What approach did we try?

We simulate ink-strokes by utilizing one ink texture, and map the texture onto the surface of a
sphere. Consider the silhouette of a surface to be where the dot product of the camera view vector
and the surface normal is roughly i.e. slightly above 0, but below a certain threshold. Intuitively
this is because right at the edge of a surface we expect the surface normal to be exactly
perpendicular to the camera vector corresponding to a dot product of 0. We include a thresholding
factor to thicken the silhouettes.

```
silhouette(v) = texture(brush_texture, refl(cam, normal).uv)
```

For the shading, we use a simplified lighting model which is similar to cel-shading. We compute
a texture at run-time which is quantized shades of gray multiplied by an exponentiated transition from
white to black:
```
shading(v) = quantized_color(v) * Math.pow(v, smoothing_constant);
where v = dot(Normal, Light)
```
Most existing work precomputes quantized colors then performs a gaussian blur over the image
but this allows for more flexibility in rendering.

The resulting color is then a multiplication of the two:
```
color(v) = shading(v) * silhouette(v);
```

Our background is just a static image. Prior work chose to multiply a similar texture by every
pixel, but we achieve a similar affect on the surface by performing "fly-white". Fly-white is
essentially randomly darkening or whitening every color to simulate ink splatter.

#### Under what circumstances do we think it should work well?

It does look a little off at certain angles and with certain models that don't have a high
number of vertices. However, in most circumstances it creates a pretty picture.

#### Why do we think it should work well under those circumstances?

We mostly judge by eye as to whether or not our renderer works well. We have
reference images from the papers cited above as well as numerous examples of ink wash
painting available online for visual comparison. With these resources we are able to
determine whether or not our renderer works well under various circumstances, and
in general it does.

## Methodology
#### What pieces had to be implemented to execute my approach?

We started from the very ground up, adding in both orthographic and perspective cameras and
adding a bunch of tunable parameters there. We manually import OBJ files and compute the average
normal for every vertex so we can get a smooth mesh and don't need to rely on normal maps or the
creator correctly specifying vertex normals. We also added naive camera movement using the arrow
keys, q, and e. We also have a small static file server which has the OBJ files. We currently do
not use any of the MTL files as some models did not come with them and loading textures is
bothersome.

In the GLSL we perform computation of vertices in world space to clip space ([-1, 1] in all three
dimensions), and also perform multiple calculations in camera space. We also maintain a JS
class that keeps track of GLSL variables and vertices.

---

For the ink, see [previous sections](####What-approach-did-we-try?).

---

There is also procedural generation of bamboo. Some inspiration was drawn from an undergrad
thesis on rendering ink variations of bamboo. We used this as inspiration for procedural
generation of bamboo. We also chose bamboo because it's essentially a really tall cylinder so
it's easy to create.

You can consider bamboo as a series of segments connected by joints. Each joint bulges out a
bit, and curves outwards from the stalk, and they are somewhat evenly spaced up the entire stalk
of the bamboo. They also tend to have a lean due to their tall nature.

Thus, we make a bamboo segment by segment, starting from the base and picking some lean
direction in the XZ plane and some total lean below some maximum threshold, as well as some
random number of segments in some range. We then create a cylinder of some height, and attach a
joint. A joint is defined by the distribution `(1-k^2)` for k in 0 to 1, which is kind of pseudo
hyperbolic. We do this for as many segments as there are.

Live bamboo also have these nice leafy branches. These branches only exist at the joints of the
bamboo, so when building a joint, we randomly decide on the number of branches to add based on
which segment it is. The likelihood of there being a nonzero number of branches increases
quadratically as it approaches the top of bamboo. The branches, like the bamboo, are defined by
a series of branch segments, but this time they are all of equal size. Without any leaves, the
branches extend in some random direction that is nearly perpendicular to some face of the joint
without any bend. If you've seen dead bamboo, the branches are incredibly stiff and are
basically are like sticks on trees.

Of course, these are not dead bamboo, so we need to add leaves and some bend to branches. At the
end of every segment, we randomly decide to add a leaf or not, with the probability increasing
from 0 to 1 quadratically as we go from the 0th segment to the last. This pushes most leaves
toward the end of the branch and guarantees some nonzero number of leaves which is nice.
If we generate a leaf, we add a small downward factor to the direction of the branch and
renormalize it, to simulate the weight of leaves and a nice little bend to the branches.

The leaves are essentially just one small and one large diamond connected on the outside, with one
being a closed face and shifted a bit in the direction of the leaves' normal. They look a bit
jank if you look directly at one, but when there are a lot they look fine.

The purpose of the bamboo is to "stage" the model, or create some background around them. Thus,
we randomly pick some direction in XZ plane and a radius in some range and create N bamboo in
this manner. There is no attempt to evenly distribute them, but it ends up looking fine. It
looks real nice with orthographic or perspective on low FOV with a very dense forest.

---

For completeness of scenery, we also throw in rings of mountains around the origin using fractal
brownian motion. We use the term ring because there are very few radii which we compute
mountains at it because they are so far away you can't see the difference. We do this by
creating circles around the origin, and computing fractal brownian motion after converting the
XZ coordinate to polar. We also linearly interpolate some maximum amplitude from 0 to 1 then
back to 0 from the minimum radius to the maximum radius. We also add an additional
hyperparameter of "precision" which is how many points along the circle it is evaluated at.

---

There is also a small seal that can be added which is just a red box with rounded corners in
pure HTML + CSS but it adds a lot because traditional paintings always have a seal. Just a
cherry on top.

#### Were there several possible implementations?

Yes. What?

#### If there were several possibilities, what were the advantages/disadvantages of each?

This one was the first one that came to mind.

#### Which implementation(s) did we do? Why?

Once again, first that came to mind. Probably because simpler is easier.

#### What did we implement?

See above.

#### What didn't we implement? Why not?

I was thinking about implementing clouds/fog, but no idea how to model that.
Was also thinking about applying velocity to rendering and adding some ink dripping effect but
no idea how to make that work either.

## Results
#### How did we measure success?

Did it look good or not?

#### What experiments did we execute?

Chucked a ton of OBJ models at it, spend some time looking at the picture and seeing whether we
liked it or not.

#### What do my results indicate?

Seems fine to me, can always do more.

## Discussion
#### Overall, is the approach we took promising?

I think it's unclear exactly which directions to take this besides adding more procedural
generation and features but it seems to work pretty well. Notably, we would want to add more
shaders and intermediate stages but that might slow down rendering so it's unclear.

#### What different approach or variant of this approach is better?

No idea, gotta try it out and see.

#### What follow-up work should be done next?

Looking at what is missing from authentic art and try to incorporate the small details in there.
Also adding more dynamics because ink movement would really be amazing to see.

#### What did we learn by doing this project?

How vertex and fragment shaders work. Some about procedural generation, and stuff about the
general workflow.

## Conclusion
#### How effectively did we attain our goal?

I'd rate a solid 5/7.

#### What would the next steps be?

More procedural generation, dynamics, etc.

#### What are issues we need to revisit?

Allow for scaling, transforming, and rotating obj models.

## Works Cited

Implementation references:

General Ink Rendering
http://www.myeglab.com/Content/sumi_e_painting.pdf

Bamboo inspiration
https://scholarworks.wm.edu/cgi/viewcontent.cgi?article=2187&context=honorstheses

General NPR tips
https://docs.lib.purdue.edu/cgi/viewcontent.cgi?article=1784&context=open_access_theses

Model references:

Sekiro Low-Poly
https://sketchfab.com/3d-models/low-poly-sekiro-f9d7ca6a005c47798f6fbb92ca9887d0

Teapot:
https://graphics.stanford.edu/courses/cs148-10-summer/as3/code/as3/teapot.obj

Littlest Neo Tokyo
https://sketchfab.com/3d-models/littlest-neo-tokyo-a2a3da11ba9a4ac5a734d1fd9fa6c402

Dabrovic Sponza
https://casual-effects.com/data/

Torii
https://sketchfab.com/3d-models/torii-gate-c64d94871bc541a0a5b11d98b787b82e

Shujiro Castle
https://sketchfab.com/3d-models/shuri-castle-shurijo-naha-okinawa-wip-45f901e4d6fa4192a6f329e35f2dc5b8

Shanghai
https://sketchfab.com/3d-models/shanghai-city-scene-7dfb633ca4d8430f914d20a5213cfc6f

Chinese Banian Tree
https://sketchfab.com/3d-models/china-banian-tree-c48069bdcd534aee86f098f7ddd5e5b2

