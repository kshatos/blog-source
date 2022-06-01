---
author: "Keagan Shatos"
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
  <input type="range" min="0.1" max="1.0" step="0.01" value=0.5" class="slider" id="albedoRSlider">
  Red
</div>

<div>
  <input type="range" min="0.1" max="1.0" step="0.01" value="0.0" class="slider" id="albedoGSlider">
  Green
</div>

<div>
  <input type="range" min="0.1" max="1.0" step="0.01" value="0.0" class="slider" id="albedoBSlider">
  Blue
</div>

<div>
  <input type="range" min="0.0" max="1.0" step="0.01" value="0.0" class="slider" id="metallicSlider">
  Metallic
</div>
  
<div>
  <input type="range" min="0.1" max="0.8" step="0.01" value="0.1" class="slider" id="roughnessSlider">
  Roughness
</div>

<div>
  <input type="range" min="0.5" max="5.0" step="0.1" value="1.0" class="slider" id="brightnessSlider">
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
The specular response is much more complicated. It depends on the material parameters (namely roughness), the normal, and view directions. These complications are simplified by the following approximations. First, the view angle is assumed to be equal to the normal. Second, the so called "Split Sum" approximation is used to simplify the integral and importance sampling is used for numerical integration. The split sum approximation essentially assumes a uniform light distribution and then corrects by multiplying by an averaged light intensity. This separates the environment factors, and the material factors, allowing each to be treated separately. Massaging the equation yields the formula for the exact averaged light intensity.

$$ L_o = \int DVF L_i(l) (n \cdot l) d\Omega $$
$$ = \frac{\int DVF L_i(l) (n \cdot l) d\Omega}{\int DFV (n \cdot l) d\Omega} \int DFV (n \cdot l) d\Omega $$
$$ = \bar{L} \int DFV (n \cdot l) d\Omega$$

## Pre Filter Map
The averaged light factor depends on the sample direction, and the roughness. A convenient way to store this data is in a 2D texture, with different roughness values corresponding to the mip-map levels of the texture. As increasing the roughness makes the reflection blurrier, the lower mip resolution for increasing levels is tolerable. To calculate it, we use importance sampled Monte-Carlo integration.

$$ \bar{L} = \frac{\frac{1}{N} \sum \frac{DVF L_i (n \cdot l) sin(\theta)}{p}}{\frac{1}{N} \sum \frac{DVF (n \cdot l) sin(\theta)}{p}}$$

Using the GGX importance sampling, for the probability distribution yields.

$$ \bar{L} = \frac{\frac{1}{N} \sum \frac{DVF L_i (n \cdot l) sin(\theta)}{D (n \cdot l) sin(\theta)}}{\frac{1}{N} \sum \frac{DVF (n \cdot l) sin(\theta)}{D (n \cdot l) sin(\theta)}}$$

Applying one more approximation of the VF term yields the final formula.

$$ VF \approx (n \cdot l) $$
$$ = \frac{\frac{1}{N} \sum (n \cdot l) L_i}{\frac{1}{N} \sum (n \cdot l) }$$


<img style="width:auto;height:250px" src=https://learnopengl.com/img/pbr/ibl_prefilter_map.png>

## BRDF Look Up Table
The second term in the split sum approximation only contains info about the material model. Applying the integration method.

$$ \frac{1}{N} \sum \frac{DVF (n \cdot l) sin(\theta)}{D (n \cdot l) sin(\theta)} $$
$$ \frac{1}{N} \sum VF $$

For this term, we will be more precise and account for the fresnel term. We can begin by expanding the fresnel term out.

$$ \frac{1}{N} \sum V (F_0 + (1 - F_0) (1 - h \cdot v)^5) $$
$$ \frac{1}{N} \sum V (F_0  (1 - (1 - h \cdot v)^5) + (1 - h \cdot v)^5) $$

We can extract out the material information here into a multiplicative factor.
$$
F_0 \frac{1}{N} \sum V (1 - (1 - h \cdot v)^5  + \frac{1}{N} \sum V (1 - h \cdot v)^5) 
$$

$$ F_0 A(\alpha, (n \cdot v)) + B(\alpha, (n \cdot v)) $$

After doing the integration, we're left with two terms that are a function of the surface roughness, and the view to normal angle. Conveniently, everything is in the range [0, 1] and can be precomputed and stored in a 2D texture. This texture has (roughness, view angle) as (u, v), and the red and green channels store the A and B terms respectively.

<img style="width:auto;height:250px" src=https://learnopengl.com/img/pbr/ibl_brdf_lut.png>

## Putting It All Together
With all of the pre-computation done, the final shader is fairly simple. The diffuse radiance is sampled with the surface normal vector, the pre-filtered color with the reflected vector & roughness for mip level, and the BRDF LUT with the relevant parameters. The specular and diffuse weights are calculated as before, and the final result is calculated with the following formula.

$$ L = k_D L_{d} + \bar{L} (F_0 A + B) $$

With a little bit of extra work, the final shader only requires a few texture samples and handful of basic arithmetic operations.

## A Note On Importance Sampling
Importance sampling is a numerical technique for reducing the number of samples needed during Monte-Carlo integration. Say we want to compute the following integral
$$ \int f(x) dx $$
We could just generate uniformly random points and apply the Monte-Carlo method and get the following.
$$ \frac{V}{N} \sum  f(x_i) $$
If only points in some region of the sample space contribute greatly to the integral however, all the points sampled outside this region will be a relative waste of effort. Instead we could sample the points non-uniformly with some probability distribution that is high where samples are more important. This changes the integration formula slightly.
$$ \int \frac{f(x)}{p(x)}  (p(x)dx) \approx \frac{V}{N} \sum \frac{f(x_i)}{p(x_i)}$$
For the integrals used in image based lighting, the normal distribution function with the solid angle and normal alignment factor is used to determine what directions are important.
$$ p(\theta, \phi) = \frac{2\alpha^2 cos(\theta) sin(\theta)}{((\alpha^2 - 1)cos^2(\theta)+1)^2} $$
The cumulative distribution function is.
$$C(\theta) = \frac{\alpha^2}{cos^2(\theta)(\alpha^2-1)^2+(\alpha^2-1)} - \frac{1}{\alpha^2-1} $$
Inverting yields
$$ \theta = C^{-1}(x) = cos^{-1}(\sqrt{\frac{1-x}{x(\alpha^2-1)+1}}) $$
To generate a biased sample for this pdf, one simply generates a random sample in the \[0, 1\] plane, and transforms them to spherical coordinates with the following formulae.
$$ \theta = C^{-1}(x_1)$$
$$ \phi = 2\pi x_2 $$
When dividing by the pdf, usually the solid angle density, normal alignment factor, and/or the normal distribution function factor will cancel out of the integrand.


## References
* [hdrlabs archive](http://www.hdrlabs.com/sibl/archive.html)
* [Unreal Engine 4 Documentation](https://cdn2.unrealengine.com/Resources/files/2013SiggraphPresentationsNotes-26915738.pdf)
* [learn opengl](https://learnopengl.com/PBR/IBL/Diffuse-irradiance)
* [Discussion on split sum](https://zero-radiance.github.io/post/split-sum/)
