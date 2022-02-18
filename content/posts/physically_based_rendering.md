---
author: "Keagan Shatos"
date: 2022-16-02
title: Physically Based Rendering
draft: false
---

Rendering 3D scenes is an important part of communicating information to the user in many software applications. Basing the rendering algorithm on a physical model of light can produce images that are more realistic, and therefore can provide the user a more intuitive understanding of the 3D scenes (as well as often being more pleasing to the eye). So how does light work, and how can we simulate it in our rendering algorithms?

## Electromagnetic Waves
For most contexts, light is well described by the electromagnetic field. All lighting information is contained in two vector fields (electric and magnetic) that permeate all of space and evolve in time according to the Maxwell equations.

$$ \nabla\cdot E = \frac{\rho}{\epsilon_0} $$
$$ \nabla\cdot B = 0 $$
$$ \nabla\times E = - \dot{B} $$
$$ \nabla\times B = \mu_0(J + \epsilon_0 \dot{E}) $$

The characteristic solution to these equations in a vacuum is a plane wave of any frequency traveling through space at a constant speed. General solutions can be built by adding up these kinds of waves. The results can form complex patterns, especially when interacting with solid objects.

<img style="width:auto;height:250px;" src="https://upload.wikimedia.org/wikipedia/commons/9/99/EM-Wave.gif">
<img style="width:auto;height:250px;" src="https://thumbs.gfycat.com/AnimatedGregariousFly-max-1mb.gif">

## The Human Eye
How does this relate to what we actually see? When a person sees, their brain is basically responding to the electromagnetic field vibrating at a small point in the back of their eyeball. This response is experienced as a color. Human eyes however are only sensitive to light with a wavelength from about 400-700 nm. For reference, a human hair is about 80,000 nm wide.

<img style="width:400px;height:auto;" src="https://upload.wikimedia.org/wikipedia/commons/d/d9/Linear_visible_spectrum.svg">

The color one sees is not determined by the amount of light at every frequency in this range, but rather by the cumulative response of three separate types of cone cells. Each type of cone has different weights for each frequency and sums them up to produce a total response. A useful consequence of this, is that you can stimulate the eye with light of different frequency profiles and get the same color response. For example, the following frequency profiles would produce the same color when seen.

<img style="width:auto;height:250px;" src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Cones_SMJ2_E.svg/1280px-Cones_SMJ2_E.svg.png">
<img style="width:auto;height:250px;" src="/images/equivalent_spectral.png">

As you can see, the human eye is a very lossy measurement device. All of the information in the electromagnetic field at a point is filtered down to how strongly each of the 3 types of cones respond. This allows us to represent light frequency data as a vector of 3 weights for the colors red, green and blue, while still being able to produce most of the colors a person can see.

## Geometric Optics
If you take the limit of the maxwell equations for very short wavelengths (relative to the size of the geometry of interest), you can show that wavefronts of light travel in straight lines radiating out from the wavefront. This leads to the concept of a light ray, essentially a small chunk of a wavefront. A light ray carries a small piece of the light energy along a straight line through a homogeneous material. When a ray propagates through an interface of two different optical media, some of the ray is reflected back at an equal angle of incidence, some propagates through the material at a different angle, and some is absorbed. The ratios and diffraction angle depend on the optical properties of the two materials.

<img style="width:auto;height:250px;" src=https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Ray_optics_diagram_incidence_reflection_and_refraction.svg/1920px-Ray_optics_diagram_incidence_reflection_and_refraction.svg.png>
<img style="width:auto;height:250px;" src=https://upload.wikimedia.org/wikipedia/commons/d/dc/Snells_law_wavefronts.gif>

In this model, simulating light is simplified to breaking light sources up into rays, propagating them along straight lines through space, and reflecting/refracting them at surfaces.

## Diffuse and Specular Reflections
The reflected light changes direction and goes on its way producing a specular reflection. The refracted light however doesn't stop there. The ray can bounce around and reflect/refract many more times off of internal crystal boundaries in the material. The net result is that many rays return back through the original surface traveling in essentially random directions, producing a diffuse reflection.

<img style="width:auto;height:250px;" src=https://upload.wikimedia.org/wikipedia/commons/2/21/Diffuse_reflection.gif>

Different materials produce different kinds of reflections depending on their optical properties. They can roughly be sorted into two types, dielectric and metallic. Dielectrics are weak absorbers, and so produce a spectral reflection that is unaltered. The diffuse reflection however gets absorbed a little bit by the many interactions, leading to diffuse light being the color of the material. Metals on the other hand are strong absorbers and so filter the spectral reflection to the color of the material and absorb all diffuse light before it can escape.

<img style="width:auto;height:200px;" src=https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Copper_Pot.jpg/330px-Copper_Pot.jpg>
<img style="width:auto;height:200px;" src=https://www.maxpixel.net/static/photo/1x/Joy-Ball-Colorful-Play-Balls-Background-Fun-71697.jpg>

## Microfacet
For most surfaces, the scale of the smallest features are larger than the wavelengths of visible light, but much smaller than the size of the pixel being shaded. In this in-between scale, geometric optics can be used for reflections, but there is a distribution of normals over the pixel. In order to apply the geometric optics model, we need to average reflections over this micro geometry.

<img width=300 src=https://www.researchgate.net/profile/Andrew-Wallace-2/publication/220659824/figure/fig9/AS:380046536658952@1467621563852/An-illustration-of-the-microfacet-surface-model.png>

<img width=300 src=https://google.github.io/filament/images/diagram_fr_fd.png>

 A small column of parallel incoming light will be reflected in many directions by the micro geometry. These averaged amplitudes are described by a bidirectional reflectance distribution function (BRDF). The function tells you what fraction of light from one incoming direction is transmitted to any other outgoing direction. If you know the incoming distribution of light on a surface and the BRDF, then simply adding up the contributions from each incoming direction yields the total reflected light.

$$ L_o(v) = \int f_r(v, l) L_i(l) (n \cdot l) d\Omega $$

## A concrete model
The baseline model used for physically based rendering is called the Cook-Torrance BRDF. The model is parametrized by surface roughness, a metallic parameter, and an albedo color. It is a sum of diffuse and specular terms

$$ f_{CT} = f_{diffuse} + f_{specular} $$

The specular term is broken down into 3 factors D, G, and F.

$$ f_{specular} = \frac{DFG}{4 (l \cdot n)( v \cdot n)} $$

The D factor accounts for the distribution of normals at the micro level. It's essentially how aligned the average normal is with the halfway vector between the light and view directions. It's calculated from the surface normal, halfway vector, and the roughness parameter.

$$ D = \frac{\alpha^2}{\pi ((n \cdot h)^2(\alpha^2 - 1) + 1)^2} $$

The G factor accounts for self-shadowing of the surface. Some points on the surface are blocked from the light source by neighboring bumps, and similarly some reflected rays are blocked from the view direction. For simplicity, most models do not account for more than one reflection. (in principle a blocked ray could reflect back onto the surface, reflect again and head out in the view direction.) Since incoming and outgoing occlusion are identical, the G factor is a product of two identical functions of the incoming and outgoing directions.

$$ G = \frac{2(n \cdot l)}{(n \cdot l) + \sqrt{\alpha^2 + (1 - \alpha)^2 (n \cdot l)^2}} \frac{2(n \cdot v)}{(n \cdot v) + \sqrt{\alpha^2 + (1 - \alpha)^2 (n \cdot v)^2}} $$

The F factor accounts for the amount of incoming light that is reflected versus refracted based on the difference in optical properties of the materials. The Fresnel-Schlick approximation is usually used instead of the full Fresnel equations.

$$ F = F_0 + (1 - F_0) (h \cdot v)^5 $$

The base reflectivity depends on the material, but can be modeled simply by an albedo color and whether or not the material is metallic.

$$ F_0 = 0.04 \mu + C_{albedo} (1 - \mu) $$

The diffuse term uses the Lambertian reflectance model, where reflected light transmits to each direction with the same constant factor.

$$ f_{diffuse} = \frac{c}{\pi} $$

The constant factor is determined using energy conservation. The light not reflected by the F term is assumed to contribute to the diffuse term. Its then filtered by a diffuse color.

$$ c = (1 - F) C_{diffuse} $$

The diffuse color is the surface albedo modified by whether the surface is metallic or not.

$$ C_{diffuse} = C_{albedo} (1 - \mu) $$

## Light Sources
The simplest and most commonly used light sources are punctual lights. A punctual light is infinitely small so only one ray hits the lit surface, simplifying the reflectance equation. They commonly  come in three types, point, directional, and spotlight.

A point light is infinitely small, emits light equally in all directions, and the intensity follows the inverse square law. 

$$ L_{point} = \frac{\phi}{4 \pi} \frac{1}{d^2} (n \cdot l) $$

A directional light models a point light so far away that the distance is essentially constant and incoming rays are all parallel.

$$ L_{directional} = L_{\perp} (n \cdot l) $$

A spot light is a point light with a directional mask that blocks rays going in certain directions. For a circular spotlight.

$$ L_{spot} = \frac{\phi}{4 \pi} \frac{1}{d^2} (n \cdot l) \frac{l \cdot d_{light} - \cos(\theta_{outer})}{\cos(\theta_{inner}) - \cos(\theta_{outer})} $$

## Tone Mapping
The model so far has calculated reflected radiance, but this needs to be converted to a color in the range of [0,1] so that the monitor can display it. A simple mapping that does the job is Reinhard's mapping.

$$ C_{RGB} = \frac{L}{1 + L} $$

## Final Algorithm
With all the pieces in place we can now shade a surface pixel in a scene. To shade a pixel.
1. Calculate the surface properties that define the BRDF
2. For each visible light, integrate the reflectance equation to get the lights total contribution
3. Add up each lights contribution to get the total reflected radiance.
4. Convert the total radiance to a color to be displayed on screen

## Conclusion
The algorithm outlined above uses many approximations but can produce impressive results that capture many of the details of real lighting without requiring a huge number of parameters.

## Resources
* [The Filament render engine's documentation](https://google.github.io/filament/Filament.html)
* [Learn OpenGL's discussion of the theory](https://learnopengl.com/PBR/Theory)
* [Naty Hoffman's Lecture for SIGGRAPH](https://www.youtube.com/watch?v=j-A0mwsJRmk&t=1354s)
* [Naty Hoffman's notes on shading physics](https://blog.selfshadow.com/publications/s2013-shading-course/hoffman/s2013_pbs_physics_math_notes.pdf)
