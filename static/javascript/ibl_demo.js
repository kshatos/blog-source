

function RenderData(gl)
{
    // Mesh
    this.mainSphere = new Model(gl);
    this.outerSphere = new Model(gl);
    this.plane = new Model(gl);

    // Shaders
    this.IBLShader = new ShaderProgram(gl);
    this.outerSphereShader = new ShaderProgram(gl);
    this.diffuseIntegrationShader = new ShaderProgram(gl);

    // Texture
    this.evironmentRadianceTex = new Texture2D(gl);
    this.diffuseTex = new Texture2D(gl);
    this.prefilterTex = new Texture2D(gl);
    this.BRDFTex = new Texture2D(gl);

    // Camera
    this.camera = new PerspectiveCamera();
}

function rotateFromZUpToYUp(transform)
{
    quat.rotateX(transform.rotation, transform.rotation, 0.5 * Math.PI);
}

function initializeUniformData(renderData)
{
    renderData.albedo = [0.0, 0.0, 0.0]
    renderData.metallic = 0.0;
    renderData.roughness = 0.0;

    vec3.add(
        renderData.camera.transform.position,
        renderData.camera.transform.position,
        [0.0, 0.0, 10.0]);
}

function initializeUI(renderData)
{
    var albedoRSlider = document.getElementById("albedoRSlider");
    renderData.albedo[0] = albedoRSlider.value;
    albedoRSlider.oninput = function() {
        renderData.albedo[0] = albedoRSlider.value;
    }

    var albedoGSlider = document.getElementById("albedoGSlider");
    renderData.albedo[1] = albedoGSlider.value;
    albedoGSlider.oninput = function() {
        renderData.albedo[1] = albedoGSlider.value;
    }

    var albedoBSlider = document.getElementById("albedoBSlider");
    renderData.albedo[2] = albedoBSlider.value;
    albedoBSlider.oninput = function() {
        renderData.albedo[2] = albedoBSlider.value;
    }

    var metallicSlider = document.getElementById("metallicSlider");
    renderData.metallic = metallicSlider.value;
    metallicSlider.oninput = function() {
        renderData.metallic = metallicSlider.value;
    }

    var roughnessSlider = document.getElementById("roughnessSlider");
    renderData.roughness = roughnessSlider.value;
    roughnessSlider.oninput = function() {
        renderData.roughness = roughnessSlider.value;
    }
}

function drawOuterSphere(gl, renderData)
{
    let shader = renderData.outerSphereShader;
    let model = renderData.outerSphere;

    if (shader.program == null) { return; }

    shader.use();
    renderData.evironmentRadianceTex.use(gl.TEXTURE0);

    let modelMatrix = model.transform.getMatrix();
    let normalMatrix = normalFromModelMatrix(modelMatrix);

    normalMatLoc = gl.getUniformLocation(shader.program, "u_NormalMatrix");
    gl.uniformMatrix3fv(normalMatLoc, false, normalMatrix);

    modelMatLoc = gl.getUniformLocation(shader.program, "u_ModelMatrix");
    gl.uniformMatrix4fv(modelMatLoc, false, modelMatrix);
    
    viewMatLoc = gl.getUniformLocation(shader.program, "u_ViewMatrix");
    gl.uniformMatrix4fv(viewMatLoc, false, renderData.camera.viewMatrix);

    projMatLoc = gl.getUniformLocation(shader.program, "u_ProjectionMatrix");
    gl.uniformMatrix4fv(projMatLoc, false, renderData.camera.projectionMatrix);

    cameraPosLoc = gl.getUniformLocation(shader.program, "u_viewPos");
    gl.uniform3fv(cameraPosLoc, renderData.camera.transform.position);

    albedoLoc = gl.getUniformLocation(shader.program, "u_albedo");
    gl.uniform3fv(albedoLoc, renderData.albedo);

    metallicLoc = gl.getUniformLocation(shader.program, "u_metallic");
    gl.uniform1f(metallicLoc, renderData.metallic);

    roughnessLoc = gl.getUniformLocation(shader.program, "u_roughness");
    gl.uniform1f(roughnessLoc, renderData.roughness);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.mesh.indexBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.mesh.vertexBuffer);

    positionID = 0;
    normalID = 1
    uvID = 2;

    gl.vertexAttribPointer(positionID, 3, gl.FLOAT, false, 4*8, 0);
    gl.enableVertexAttribArray(positionID);

    gl.vertexAttribPointer(normalID, 3, gl.FLOAT, false, 4*8, 4*3);
    gl.enableVertexAttribArray(normalID);

    gl.vertexAttribPointer(uvID, 2, gl.FLOAT, false, 4*8, 4*6);
    gl.enableVertexAttribArray(uvID);

    gl.drawElements(gl.TRIANGLES, sphereMesh.indices.length, gl.UNSIGNED_SHORT, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function drawMainSphere(gl, renderData)
{
    let shader = renderData.IBLShader;
    let model = renderData.mainSphere;

    if (shader.program == null) { return; }

    shader.use();
    renderData.diffuseTex.use(gl.TEXTURE0);
    renderData.prefilterTex.use(gl.TEXTURE1);
    renderData.BRDFTex.use(gl.TEXTURE2);

    let modelMatrix = model.transform.getMatrix();
    let normalMatrix = normalFromModelMatrix(modelMatrix);

    normalMatLoc = gl.getUniformLocation(shader.program, "u_NormalMatrix");
    gl.uniformMatrix3fv(normalMatLoc, false, normalMatrix);

    modelMatLoc = gl.getUniformLocation(shader.program, "u_ModelMatrix");
    gl.uniformMatrix4fv(modelMatLoc, false, modelMatrix);
    
    viewMatLoc = gl.getUniformLocation(shader.program, "u_ViewMatrix");
    gl.uniformMatrix4fv(viewMatLoc, false, renderData.camera.viewMatrix);

    projMatLoc = gl.getUniformLocation(shader.program, "u_ProjectionMatrix");
    gl.uniformMatrix4fv(projMatLoc, false, renderData.camera.projectionMatrix);

    cameraPosLoc = gl.getUniformLocation(shader.program, "u_viewPos");
    gl.uniform3fv(cameraPosLoc, renderData.camera.transform.position);

    albedoLoc = gl.getUniformLocation(shader.program, "u_albedo");
    gl.uniform3fv(albedoLoc, renderData.albedo);

    metallicLoc = gl.getUniformLocation(shader.program, "u_metallic");
    gl.uniform1f(metallicLoc, renderData.metallic);

    roughnessLoc = gl.getUniformLocation(shader.program, "u_roughness");
    gl.uniform1f(roughnessLoc, renderData.roughness);

    diffuseTexLoc = gl.getUniformLocation(shader.program, "u_diffuseEnvironmentTex");
    gl.uniform1i(diffuseTexLoc, 0);

    prefilterTexLoc = gl.getUniformLocation(shader.program, "u_prefilterEnvironmentTex");
    gl.uniform1i(prefilterTexLoc, 1);

    brdftexLoc = gl.getUniformLocation(shader.program, "u_BRDFTex");
    gl.uniform1i(brdftexLoc, 2);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.mesh.indexBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.mesh.vertexBuffer);

    let positionID = 0;
    let normalID = 1
    let uvID = 2;

    gl.vertexAttribPointer(positionID, 3, gl.FLOAT, false, 4*8, 0);
    gl.enableVertexAttribArray(positionID);

    gl.vertexAttribPointer(normalID, 3, gl.FLOAT, false, 4*8, 4*3);
    gl.enableVertexAttribArray(normalID);

    gl.vertexAttribPointer(uvID, 2, gl.FLOAT, false, 4*8, 4*6);
    gl.enableVertexAttribArray(uvID);

    gl.drawElements(gl.TRIANGLES, sphereMesh.indices.length, gl.UNSIGNED_SHORT, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

function drawScene(gl, renderData)
{
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT);

    drawOuterSphere(gl, renderData)
    drawMainSphere(gl, renderData);
}

function integrateDiffuse(gl, renderData)
{
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT);

    let shader = renderData.diffuseIntegrationShader;
    let model = renderData.plane;

    if (shader.program == null) { return; }

    shader.use();
    renderData.evironmentRadianceTex.use(gl.TEXTURE0);

    envTexLoc = gl.getUniformLocation(shader.program, "u_EnvironmentTexture");
    gl.uniform1i(envTexLoc, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.mesh.indexBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, model.mesh.vertexBuffer);

    let positionID = 0;
    let normalID = 1
    let uvID = 2;

    gl.vertexAttribPointer(positionID, 3, gl.FLOAT, false, 4*8, 0);
    gl.enableVertexAttribArray(positionID);

    gl.vertexAttribPointer(normalID, 3, gl.FLOAT, false, 4*8, 4*3);
    gl.enableVertexAttribArray(normalID);

    gl.vertexAttribPointer(uvID, 2, gl.FLOAT, false, 4*8, 4*6);
    gl.enableVertexAttribArray(uvID);

    gl.drawElements(gl.TRIANGLES, planeMesh.indices.length, gl.UNSIGNED_SHORT, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}


function main()
{
    // Setup webGL context
    const canvas = document.querySelector("#glCanvas");
    const gl = canvas.getContext("webgl");
  
    if (gl === null) {
      alert("Unable to initialize WebGL. Your browser or machine may not support it.");
      return;
    }

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.cullFace(gl.BACK);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    // Initialize render data
    renderData = new RenderData(gl);

    renderData.plane.mesh.loadMeshFromObject(planeMesh);

    renderData.outerSphere.mesh.loadMeshFromObject(invertedSphereMesh);
    rotateFromZUpToYUp(renderData.outerSphere.transform);
    renderData.outerSphere.transform.scale = vec3.fromValues(30.0, 30.0, 30.0);

    renderData.mainSphere.mesh.loadMeshFromObject(sphereMesh);
    rotateFromZUpToYUp(renderData.mainSphere.transform);

    loadTextFile("\\shaders\\ibl_demo.vs", function(vertexSource) {
        loadTextFile("\\shaders\\ibl_demo.fs", function(fragmentSource) {
            renderData.IBLShader.compileFromSource(vertexSource, fragmentSource);
        });
    });

    loadTextFile("\\shaders\\projection.vs", function(vertexSource) {
        loadTextFile("\\shaders\\projection.fs", function(fragmentSource) {
            renderData.outerSphereShader.compileFromSource(vertexSource, fragmentSource);
        });
    });

    loadTextFile("\\shaders\\diffuse_integration.vs", function(vertexSource) {
        loadTextFile("\\shaders\\diffuse_integration.fs", function(fragmentSource) {
            renderData.diffuseIntegrationShader.compileFromSource(vertexSource, fragmentSource);
        });
    });

    const environmentImage = new Image();
    environmentImage.onload = function() {
        renderData.evironmentRadianceTex.loadFromImage(environmentImage);
        environmentImage.y
        renderData.diffuseTex.resize(256, 256);
        renderData.prefilterTex.loadFromImage(environmentImage);
    }
    environmentImage.src = "\\images\\ibl_hdr_radiance.png";

    /*
    const irradianceImage = new Image();
    irradianceImage.onload = function() {
        renderData.diffuseTex.loadFromImage(irradianceImage);
    }
    irradianceImage.src = "\\images\\ibl_hdr_irradiance.jpg";
    */

    const brdfImage = new Image();
    brdfImage.onload = function() {
        renderData.BRDFTex.loadFromImage(brdfImage);
    }
    brdfImage.src = "\\images\\ibl_brdf_lut.png";

    initializeUniformData(renderData);
    initializeUI(renderData);

    // Animate
    lastTime = 0.0;
    function frameWork(currentTime)
    {
        let deltaTime = currentTime - lastTime;

        let angleChange = deltaTime * 0.0005;
        let transform = renderData.camera.transform;
        vec3.rotateY(transform.position, transform.position, [0, 0, 0], angleChange);
        quat.rotateY(transform.rotation, transform.rotation, angleChange);
        renderData.camera.updateMatrices();

        integrateDiffuse(gl, renderData);
        //drawScene(gl, renderData);

        lastTime = currentTime;
        requestAnimationFrame(frameWork);
    }
    requestAnimationFrame(frameWork);
}

window.onload = main;
