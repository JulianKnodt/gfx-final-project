# Written Report

Julian Knodt, Eric Tsang

## Abstract
This project implements hardware-accelerated ink wash painting for 3D objects
based on the work of [Park et al.](http://www.myeglab.com/Content/sumi_e_painting.pdf)
and adapted for the web using GLSL and ThreeJS.

## Introduction
### Goal

We wanted to make a non-photo realistic renderer for simulating Chinese ink-painting.

#### What did we try to do?

Using prior work on such techniques, we tried to implement such a system in GLSL and ThreeJS.
We using existing 3D models and simulate the ink-strokes and shading of artwork.

#### Who would benefit?

Anyone who appreciates art. This is just a fun project, but if you enjoy ink-based art it can be considered
an open-source contribution to the community. The main benefactors of this work are people who
might want to explore ink-based rendering.

### Previous Work

There was prior work on realtime "Sumi-e" (Chinese ink art) rendering from Hallym Univ. and
Hongik Univ. in South Korea which is what our work is mostly based off. There is also some work
from the Univ. of Macao but we found that work to be exceptionally vague and hard to understand
so while it did contribute to some ideas and general understanding, it did not add anything in
particular.

There is also substantial work on 2D ink renderings, as well as an undergraduate thesis on 2D
bamboo generation which inspired 3D bamboo generation in our work.

#### What related work have other people done?

Okami is a commercial game which utilizes ink-style rendering. It's unclear how they performed
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
#### What approach did we try?

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

It can look a little off at certain angles and with certain models that don't have a high
number of vertices. However, in most circumstances it creates a pretty picture.

#### Why do we think it should work well under those circumstances?

We mostly judge by eye as to whether or not it works well. For visual comparison, we have
reference images from papers we have cited as well as numerous examples of ink wash
painting available online. With these resources we are able to
determine whether or not our renderer works well under various circumstances, and
in general it does.

## Methodology
#### What pieces had to be implemented to execute my approach?

We started from the very ground up, adding in both orthographic and perspective cameras and
adding a bunch of tunable parameters there. We manually import OBJ files and compute the average
normal for every vertex so we can get a smooth mesh and don't need to rely on normal maps or the
creator correctly specifying vertex normals. We also added naive camera movement using the arrow
keys, q, and e. We also have a small static file server which serves the OBJ files. We currently do
not use any of the MTL files as some models did not come with them and loading textures can be cumbersome.

On the GLSL side we perform computation of vertices in world space to clip space ([-1, 1] in all three
dimensions), and also perform multiple calculations in camera space.
On the JS side, we maintain a class that keeps track of GLSL variables and vertices.

---

For ink rendering techniques, refer to the [Approach](#what-approach-did-we-try) from above.

---

Another major feature we impemented was procedural generation of bamboo. Some inspiration was drawn from an undergrad
thesis on rendering ink variations of bamboo. We used this as inspiration for procedural
generation. We also chose bamboo because it's essentially a really tall cylinder so
it's easy to create.

To get into the implementation aspect of it, you can consider bamboo as a series of segments connected by joints.
Each joint bulges out a bit, and curves outwards from the stalk, and they are somewhat evenly spaced up the entire stalk
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
being a closed face and shifted a bit in the direction of the leaves' normal.
Looking at a single leaf up close is not so pretty, but when there are a lot of them they look fine together.

The purpose of the bamboo is to "stage" the model, or create some background around them. Thus,
we randomly pick some direction in XZ plane and a radius in some range and create N bamboo in
this manner. There is no attempt to evenly distribute them, but it ends up looking fine. It
looks great with either the orthographic or perspective projection on low FOV with a very dense forest.

---

For completeness of scenery, we also throw in rings of mountains around the origin using fractal
brownian motion. We use the term ring because there are very few radii which we compute
mountains at because they are so far away you can't see the difference. We do this by
creating circles around the origin, and computing fractal brownian motion after converting the
XZ coordinate to polar. We also linearly interpolate some maximum amplitude from 0 to 1 then
back to 0 from the minimum radius to the maximum radius. We also add an additional
hyperparameter of "precision" which is how many points along the circle it is evaluated at.

---

There is also a small seal that can be added which is just a red box with rounded corners in
pure HTML + CSS but it adds a lot because traditional paintings always have a seal. Just a
cherry on top.

#### Were there several possible implementations?

Yes. We only briefly alluded to other papers above since we basically chose the
first viable rendering algorithm that we could implement, so we do not have
much to say about the details of other implementations.

#### If there were several possibilities, what were the advantages/disadvantages of each?

We don't have much to say about other implementations since we only had time to try one of them,
and it was mostly a matter of simplicity in terms of choosing a rendering algorithm.
Also, pretty pictures.

#### Which implementation(s) did we do? Why?

We chose this one because it was the first one that came to mind after our research,
and it was also the simplest to implement.

#### What did we implement?

Most of the details have been covered in previous sections, but the main summary points are that
we used the ink-wash rendering algorithm from [Park et al.](http://www.myeglab.com/Content/sumi_e_painting.pdf)
and some of the bamboo generation techniques from [Yangyang He](https://scholarworks.wm.edu/cgi/viewcontent.cgi?article=2187&context=honorstheses)
in our project.

#### What didn't we implement? Why not?

We were considering implementing clouds and fog but we did not know how to model that.
We also thought about applying velocity to rendering and adding an ink dripping effect
but we did not know how to implement it.

## Results
#### How did we measure success?

We tried loading various 3D models in our renderer and judged their appearance by eye.
We also used real ink-wash paintings from online as visual comparison in addition to
reference images provided by research papers.
With that in mind however, if it looked good to us then it was considered a success.

#### What experiments did we execute?

We loaded a bunch of obj models we found online, including people models as well as architectural models
to test how model geometry affects our rendering output.

#### What do my results indicate?

Our renderer adds a nice ink-wash effect to all of the models we have tried.
Some details can look a bit off at certain angles and for models with lots of vertices as mentioned before,
but overall our renderer was hugely successful at creating the images we wanted.

Rather than include a bunch of images here, it would be best to visit our
[interactive site](http://ink-renderer.herokuapp.com/) and try it yourself!

## Discussion
#### Overall, is the approach we took promising?

Yes, it works well. Though it's unclear exactly which directions to take this in
besides adding more procedural generation and features. Notably, we would want to add more
shaders and intermediate stages but that might slow down rendering so it's unclear.

#### What different approach or variant of this approach is better?

We would have to try another approach to really find out,
but that would not be viable for this project given the time constraints.
Overall, since the implementation we went with was relatively simple and produced great results,
choosing another approach may just be for artistic preferences since different algorithms
will produce different graphical outputs, perhaps at the cost of simplicity.

#### What follow-up work should be done next?

Looking at what is missing from authentic art and trying to incorporate the
small details in there would be the next step forward.
Also, adding more dynamics because ink movement would be amazing to see.

#### What did we learn by doing this project?

As a baseline, we learned how vertex and fragment shaders work and how they tie in to the web
through a combination of ThreeJS, WebGL, and GLSL. We also learned some techniques for procedural generation.
Plus we learned a lot about the general workflow of a graphics project.

## Conclusion
#### How effectively did we attain our goal?

We developed an ink-wash renderer that creates pretty 3D models. Since that was our goal,
our project was definitely a success. The bamboo and mountain generation were more stretch goals,
so successfully implementing those was also huge. Overall, we attained our goal very effectively.

#### What would the next steps be?

Our next steps would be to add fine details, physical dynamics, and perhaps more procedural generation of landscapes.

#### What are issues we need to revisit?

While the rendering aspects of our project were successful, we could make our program more usable
by allowing for scaling, transforming, and rotating of obj models.

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
