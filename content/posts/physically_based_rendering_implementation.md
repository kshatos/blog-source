---
author: "Keagan Shatos"
date: 2022-16-02
title: Physically Based Rendering Implementation
draft: false
---


<!---
GL Canvas & UI
-->
<script src="https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/3.4.2/gl-matrix-min.js" integrity="sha512-eV9ExyTa3b+YHr99IBTYpwk4wbgDMDlfW8uTxhywO8dWb810fGUSKDgHhEv1fAqmJT4jyYnt1iWWMW4FRxeQOQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
<script src="\javascript\sphere_mesh.js" defer></script>
<script src="\javascript\pbr_demo.js" defer></script>

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


<!---
Main Content
-->
## Overview
This demo was made using javascript, webGL, and the glMatrix library. It is an implementation of the PBR algorithm outlined in my [previous post](/posts/physically_based_rendering/). The scene consists of a sphere, three point lights, and some ambient lighting. The camera spins around the sphere at a constant speed. Most of the code is boiler plate, so I'll focus mostly on the shader code. If you're interested, you can find the rest of the details [here](https://github.com/kshatos/blog-source). 

## Vertex Shader
The vertex shader performs the usual 3d calculations. The vertex's position and normal are transformed to world space and passed on to the fragment shader. The vertex's screen position is also calculated. All transformations are done with the standard model, view, projection matrices.

```cpp
void main()
{
    Pos = vec3(u_ModelMatrix * vec4(a_Position, 1.0));
    Normal = u_NormalMatrix * a_Normal;

    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * vec4(a_Position, 1.0);
}
```
## BRDF
Calculating the BRDF is done in several stages. First the fragments material parameters are packed into a struct for easy access.

```cpp
struct PBRSurfaceData
{
    vec3 position;
    vec3 normal;
    vec3 albedo;
    float metallic;
    float roughness;
};
```
Next, all the relevant dot products between the lighting and surface vectors are calculated.

```cpp
float cosNH = clamp(dot(surface.normal, halfwayDir), 1.0e-6, 1.0);
float cosNL = clamp(dot(surface.normal, lightDir), 1.0e-6, 1.0);
float cosNV = clamp(dot(surface.normal, viewDir), 1.0e-6, 1.0);
float cosVH = clamp(dot(viewDir, halfwayDir), 1.0e-6, 1.0);
```

In addition, the base reflectivity and diffuse color are calculated form the surface properties.

```cpp
vec3 F0 = mix(vec3(0.04), surface.albedo, surface.metallic);
vec3 diffuseColor =  (1.0 - surface.metallic) * surface.albedo;
```

With all of the inputs ready, The D, G, and F terms can be calculated. To save time, the common factors between the specular part the G term have been combined by replacing the G term with a "view" or V term. Each term is calculated by the following functions.

```cpp
float NormalDistribution_GGX(float cosNH, float roughness)
{
    float roughnessSquared = roughness * roughness;
    float denominator = cosNH * cosNH * (roughnessSquared - 1.0) + 1.0;
    return roughnessSquared / (PI * denominator * denominator);
}

float View_HCSmith(float cosNL, float cosNV, float roughness)
{
    float Vv = cosNL * (cosNV * (1.0 - roughness) + roughness);
    float Vl = cosNV * (cosNL * (1.0 - roughness) + roughness);

    return 0.5 / (Vv + Vl);
}

vec3 Fresnel_Schlick(float cosVH, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(1.0 - cosVH, 5.0);
}
```

The D, V, and F terms are then combined to calculate the diffuse, specular, and total reflectance amplitude.

```cpp
vec3 specular = D * V * F;
vec3 diffuse = (vec3(1.0) - F) * diffuseColor / PI;

vec3 f = diffuse + specular;

return f * cosNL;
```

The complete function for calculating the BRDF is as follows.

```cpp
vec3 BRDF(
    vec3 viewDir,
    vec3 lightDir,
    vec3 halfwayDir,
    PBRSurfaceData surface)
{
    float cosNH = clamp(dot(surface.normal, halfwayDir), 1.0e-6, 1.0);
    float cosNL = clamp(dot(surface.normal, lightDir), 1.0e-6, 1.0);
    float cosNV = clamp(dot(surface.normal, viewDir), 1.0e-6, 1.0);
    float cosVH = clamp(dot(viewDir, halfwayDir), 1.0e-6, 1.0);

    vec3 F0 = mix(vec3(0.04), surface.albedo, surface.metallic);
    vec3 diffuseColor =  (1.0 - surface.metallic) * surface.albedo;

    float D = NormalDistribution_GGX(cosNH, surface.roughness);
    float V = View_HCSmith(cosNL, cosNV, surface.roughness);
    vec3 F = Fresnel_Schlick(cosVH, F0);

    vec3 specular = D * V * F;
    vec3 diffuse = (vec3(1.0) - F) * diffuseColor / PI;

    vec3 f = diffuse + specular;

    return f * cosNL;
}
```

## Lighting
For this demo, I only implemented a point light which is parameterized by the following data.

```cpp
struct PointLight
{
    vec3 position;
    float radiantFlux;
    float range;
    vec3 color;
};
```
The reflected radiance of a point light takes as input this point light struct, plus the PBRSurface struct from before. First the relevant geometric variables are calculated.

```cpp
float separation = length(light.position - surface.position);
vec3 viewDir = normalize(u_viewPos - surface.position);
vec3 lightDir = normalize(light.position - surface.position);
vec3 halfwayDir = normalize(lightDir + viewDir);
```

The attenuation is calculated using the inverse square law, plus another factor that windows the light to a certain range.

```cpp
float PunctualLightAttenuation(float separation, float range)
{
    float separation2 = separation * separation;
    float relativeRange = min(1.0, separation / range);
    float relativeRange4 = relativeRange * relativeRange * relativeRange * relativeRange;

    return 1.0 / (separation2 + 1.0e-6) * (1.0 - relativeRange4);
}
```

The light radiance, and the BRDF are then calculated and combined into the final result. The complete function for reflectance is as follows.

```cpp
vec3 PointLightReflectedRadiance(
    PointLight light,
    PBRSurfaceData surface)
{
    float separation = length(light.position - surface.position);
    vec3 viewDir = normalize(u_viewPos - surface.position);
    vec3 lightDir = normalize(light.position - surface.position);
    vec3 halfwayDir = normalize(lightDir + viewDir);

    float A = PunctualLightAttenuation(separation, light.range);
    vec3 f = BRDF(viewDir, lightDir, halfwayDir, surface);
    vec3 L0 = light.color * light.radiantFlux / (4.0 * PI);

    return L0 * A * f;
}
```

# Putting It All Together
Everything for the fragment shaders main function is now ready. The function packs the relevant data ino the light and surface structures, accumulates the reflected radiance from all the light sources, and finally tone-maps and gamma corrects the result.

```cpp
void main()
{
    PointLight light;
    light.radiantFlux = 3000.0;
    light.range = 100.0;
    light.color = vec3(1.0, 1.0, 1.0);

    PBRSurfaceData surface;
    surface.position = Pos;
    surface.normal = normalize(Normal);
    surface.albedo = u_albedo;
    surface.metallic = u_metallic;
    surface.roughness = u_roughness * u_roughness;

    vec3 result = vec3(0.0, 0.0, 0.0);

    light.position = vec3(0.0, -1.0, 10.0);
    result = PointLightReflectedRadiance(light, surface);

    light.position = vec3(1.0, 1.0, 10.0);
    result += PointLightReflectedRadiance(light, surface);

    light.position = vec3(-1.0, 1.0, 10.0);
    result += PointLightReflectedRadiance(light, surface);

    result += 0.2 * surface.albedo;

    result = result / (result + vec3(1.0));
    result = pow(result, vec3(1.0/2.2)); 

    gl_FragColor = vec4(result, 1.0);
}
```
