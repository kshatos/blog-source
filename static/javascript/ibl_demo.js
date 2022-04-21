

function RenderData(gl)
{
    // Mesh
    this.mainSphere = new Model(gl);
    this.outerSphere = Model(gl);

    // Shaders
    this.IBLShader = new ShaderProgram(gl);

    // Texture
    this.evironmentRadianceTex = new Texture2D(gl);
    this.diffuseTex = new Texture2D(gl);
    this.prefilterTex = new Texture2D(gl);
    this.lookupTex = new Texture2D(gl);

    // Camera
    this.camera = new PerspectiveCamera();
}

function initializeUniformData(renderData)
{
    renderData.albedo = [0.0, 0.0, 0.0]
    renderData.metallic = 0.0;
    renderData.roughness = 0.0;

    vec3.add(
        renderData.camera.transform.position,
        renderData.camera.transform.position,
        [0.0, 0.0, 5.0]);
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

function updateUniformData(renderData)
{
    cameraMatrix = mat4.create();
    mat4.fromRotationTranslation(
        cameraMatrix,
        renderData.cameraRotation,
        renderData.cameraPosition);
    
    mat4.invert(renderData.viewMatrix, cameraMatrix);

    normalMatrix4 = mat4.create();
    mat4.invert(normalMatrix4, renderData.modelMatrix);
    mat4.transpose(normalMatrix4, normalMatrix4);
    mat3.fromMat4(renderData.normalMatrix, normalMatrix4);
}

function setShaderUniforms(gl, renderData)
{
    if (renderData.IBLShader.program == null) { return; }

    renderData.IBLShader.program.use();
    normalMatLoc = gl.getUniformLocation(renderData.shaderProgram, "u_NormalMatrix");
    gl.uniformMatrix3fv(normalMatLoc, false, renderData.normalMatrix);

    modelMatLoc = gl.getUniformLocation(renderData.shaderProgram, "u_ModelMatrix");
    gl.uniformMatrix4fv(modelMatLoc, false, renderData.modelMatrix);
    
    viewMatLoc = gl.getUniformLocation(renderData.shaderProgram, "u_ViewMatrix");
    gl.uniformMatrix4fv(viewMatLoc, false, renderData.viewMatrix);

    projMatLoc = gl.getUniformLocation(renderData.shaderProgram, "u_ProjectionMatrix");
    gl.uniformMatrix4fv(projMatLoc, false, renderData.projectionMatrix);

    cameraPosLoc = gl.getUniformLocation(renderData.shaderProgram, "u_viewPos");
    gl.uniform3fv(cameraPosLoc, renderData.cameraPosition);

    albedoLoc = gl.getUniformLocation(renderData.shaderProgram, "u_albedo");
    gl.uniform3fv(albedoLoc, renderData.albedo);

    metallicLoc = gl.getUniformLocation(renderData.shaderProgram, "u_metallic");
    gl.uniform1f(metallicLoc, renderData.metallic);

    roughnessLoc = gl.getUniformLocation(renderData.shaderProgram, "u_roughness");
    gl.uniform1f(roughnessLoc, renderData.roughness);
}

function drawMainSphere(gl, renderData)
{
    let shader = renderData.IBLShader;
    let model = renderData.mainSphere;

    if (shader.program == null) { return; }

    shader.use();
    renderData.evironmentRadianceTex.use();

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
    gl.drawElements(gl.TRIANGLES, sphere_mesh.indices.length, gl.UNSIGNED_SHORT, 0);
}

function drawScene(gl, renderData)
{
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT);

    renderData.camera.updateMatrices();

    drawMainSphere(gl, renderData);
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

    // Initialize render data
    renderData = new RenderData(gl);

    renderData.mainSphere.mesh.loadMeshFromObject(sphere_mesh);

    loadTextFile("\\shaders\\projection.vs", function(vertexSource) {
        loadTextFile("\\shaders\\projection.fs", function(fragmentSource) {
            renderData.IBLShader.compileFromSource(vertexSource, fragmentSource);
        });
    });

    const environmentImage = new Image();
    environmentImage.onload = function()
    {
        renderData.evironmentRadianceTex.loadFromImage(environmentImage);
    }
    environmentImage.src = "\\images\\Circus_Backstage_8k.jpg";

    initializeUniformData(renderData);
    initializeUI(renderData);

    // Animate
    lastTime = 0.0;
    function frameWork(currentTime)
    {
        let deltaTime = currentTime - lastTime;

        let angleChange = deltaTime * 0.001;
        let transform = renderData.camera.transform;
        vec3.rotateY(transform.position, transform.position, [0, 0, 0], angleChange);
        quat.rotateY(transform.rotation, transform.rotation, angleChange);

        drawScene(gl, renderData);

        lastTime = currentTime;
        requestAnimationFrame(frameWork);
    }
    requestAnimationFrame(frameWork);
}

window.onload = main;
