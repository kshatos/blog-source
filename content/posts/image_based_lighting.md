---
author: "Keagan Shatos"
date: 2022-04-08
title: "Image Based Lighting"
draft: false
---

<!---
GL Canvas & UI
-->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/3.4.2/gl-matrix-min.js" integrity="sha512-eV9ExyTa3b+YHr99IBTYpwk4wbgDMDlfW8uTxhywO8dWb810fGUSKDgHhEv1fAqmJT4jyYnt1iWWMW4FRxeQOQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="\javascript\plane_mesh.js" defer></script>
<script src="\javascript\sphere_mesh.js" defer></script>
<script src="\javascript\inverted_sphere_mesh.js" defer></script>
<script src="\javascript\webgl_util.js" defer></script>
<script src="\javascript\ibl_demo.js" defer></script>

<canvas id="glCanvas" width="500" height="500"></canvas>

<div>
  <input type="range" min="0.0" max="1.0" step="0.01" value=1.0" class="slider" id="albedoRSlider">
  Red
</div>

<div>
  <input type="range" min="0.0" max="1.0" step="0.01" value="0.0" class="slider" id="albedoGSlider">
  Green
</div>

<div>
  <input type="range" min="0.0" max="1.0" step="0.01" value="0.0" class="slider" id="albedoBSlider">
  Blue
</div>

<div>
  <input type="range" min="0.0" max="1.0" step="0.01" value="0.0" class="slider" id="metallicSlider">
  Metallic
</div>
  
<div>
  <input type="range" min="0.0" max="1.0" step="0.01" value="0.1" class="slider" id="roughnessSlider">
  Roughness
</div>

<div>
  <input type="range" min="0.0" max="100.0" step="0.1" value="0.1" class="slider" id="brightnessSlider">
  Brightness
</div>


<!---
Main Content
-->

With the proper framework in place and point lights under our belt, how can we handle more complicated lighting conditions?

## Ambient Light
Most scene objects are lit largely by ambient light. This is just the light reflected off of the background objects in the scene. The ambient light from a scene can be modeled as a continuum of point lights, infinitely far away. With these assumptions, the incoming light intensity depends only on the sample direction. This can be stored in either a 2D texture using an equirectangular projection, or a cubemap.

$$ L_{i} = f(l)$$

<img style="width:auto;height:250px;" src=http://spiralgraphics.biz/genetica/help/hmfile_hash_73296a8a.jpg>

## Precalculating
With the incoming light and BRDF known, shading is as simple as applying the reflectance equation. Unfortunately, the simple answer is quite inefficient for real time rendering (integrating requires a convolution over the whole environment map). For a static environment however, the calculations can be made much faster by doing some precalculating and making a few approximations. Lets take a look at the reflectance equation for our case.

$$ L_o = \int (\frac{c}{\pi} + DVG) L_i(l) (n \cdot l) d\Omega $$

## Diffuse Response
The diffuse part of the light intensity is constant, and can thus be easily integrated. The result only depends on the normal direction, and the precomputed integral can be stored in a lookup texture, sampled by the normal vector.
$$ L_o = \frac{c}{\pi} \int L_i(l) (n \cdot l) d\Omega $$

Integrating numerically.

$$ L_{o} = \frac{c}{\pi} \sum \limits_{j} L_i(l_j) (n \cdot l_j) \Delta \Omega_{j} $$

<img style="width:auto;height:250px" src=https://learnopengl.com/img/pbr/ibl_irradiance.png>

## Specular Response
The specular response is much more complicated. It depends on the material parameters (namely roughness), the normal, and view directions. These complications are simplified by the following approximations. First, the view angle is assumed to be equal to the normal. Second, the so called "Split Sum" approximation is used to simplify the integral and importance sampling is used for numerical integration. The split sum approximation essentially assumes a uniform light distribution and then corrects by multiplying by the average light intensity. This separates the environment factors, and the material factors, allowing each to be treated separately.

$$ L_o = \int DVF L_i(l) (n \cdot l) d\Omega $$
$$ \approx \int \frac{L_i(l)}{\pi} d\Omega \cdot \int DVF (n \cdot l) d\Omega $$
$$ \approx \frac{1}{N} \sum \limits_j \frac{L_i(l_j)}{p(l_j)} \cdot \sum \limits_k \frac{DVF (n \cdot l_k)}{p(l_k)} \Delta\Omega_k$$

## Pre Filter Map
The first term in the split sum approximation depends on the sample direction, and the roughness. A convenient way to store this data is in a 2D texture, with different roughness values corresponding to the mip-map levels of the texture. As increasing the roughness makes the reflection blurrier, the lower mip resolution for increasing levels is tolerable. 

$$ \frac{1}{N} \sum \limits_j \frac{L_i(l_j)}{p(l_j)} $$

<img style="width:auto;height:250px" src=https://learnopengl.com/img/pbr/ibl_prefilter_map.png>


## BRDF Look Up Table
The second term in the equation only contains info about the material model. 

$$ \sum \limits_k \frac{DVF (n \cdot l_k)}{p(l_k)} \Delta\Omega_k $$

We can begin simplifying by expanding the fresnel term in the integral.

$$ \sum \limits_k \frac{DV(n \cdot l_k)}{p(l_k)} (F_0 + (1 - F_0) (1 - h \cdot v)^5) \Delta\Omega_k $$

$$ \sum \limits_k \frac{DV(n \cdot l_k)}{p(l_k)} (F_0  (1 - (1 - h \cdot v)^5) + (1 - h \cdot v)^5) \Delta\Omega_k $$

$$
F_0 \sum \limits_k \frac{DV(n \cdot l_k)}{p(l_k)} (1 - (1 - h \cdot v)^5 \Delta\Omega_k +
\sum \limits_k \frac{DV(n \cdot l_k)}{p(l_k)} (1 - h \cdot v)^5) \Delta\Omega_k
$$

$$ F_0 A(\alpha, (n \cdot v)) + B(\alpha, (n \cdot v)) $$

After doing the integration, we're left with two terms that are a function of the surface roughness, and the view to normal angle. Conveniently, everything is in the range [0, 1] and can be precomputed and stored in a 2D texture. This texture has (roughness, view angle) as (u, v), and the red and green channels store the A and B terms respectively.

<img style="width:auto;height:250px" src=https://learnopengl.com/img/pbr/ibl_brdf_lut.png>


## Putting It All Together

## A note on importance sampling




## References
* [hdrlabs archive](http://www.hdrlabs.com/sibl/archive.html)
* [learn opengl](https://learnopengl.com/PBR/IBL/Diffuse-irradiance)