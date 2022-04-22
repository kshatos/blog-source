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
<script src="\javascript\sphere_mesh.js" defer></script>
<script src="\javascript\inverted_sphere_mesh.js" defer></script>
<script src="\javascript\cube_mesh.js" defer></script>
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


<!---
Main Content
-->

## References
* [hdrlabs archive](http://www.hdrlabs.com/sibl/archive.html)
* [learn opengl](https://learnopengl.com/PBR/IBL/Diffuse-irradiance)