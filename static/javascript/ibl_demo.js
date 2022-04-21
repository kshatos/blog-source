

function RenderData()
{
    // Mesh
    this.mainSphere = null;
    this.outerSphere = null;

    // Shaders
    this.IBLShader = null;

    // Texture
    this.evironmentRadianceTex = null;
    this.diffuseTex = null;
    this.prefilterTex = null;
    this.lookupTex = null;

    // Camera
    this.cameraProjectionMat = null;
    this.cameraTransform = null;

}

function buildMesh(gl, meshData)
{
    let vertexBuffer = gl.createBuffer(gl.ARRAY_BUFFER);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere_mesh.vertices), gl.STATIC_DRAW);

    positionID = gl.getAttribLocation(renderData.shaderProgram, 'a_Position');
    gl.vertexAttribPointer(positionID, 3, gl.FLOAT, false, 4*6, 0);
    gl.enableVertexAttribArray(positionID);

    normalID = gl.getAttribLocation(renderData.shaderProgram, 'a_Normal');
    gl.vertexAttribPointer(normalID, 3, gl.FLOAT, false, 4*6, 4*3);
    gl.enableVertexAttribArray(normalID);
}

function buildVertexBuffer(gl, renderData)
{
    let vertexBuffer = gl.createBuffer(gl.ARRAY_BUFFER);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sphere_mesh.vertices), gl.STATIC_DRAW);

    positionID = gl.getAttribLocation(renderData.shaderProgram, 'a_Position');
    gl.vertexAttribPointer(positionID, 3, gl.FLOAT, false, 4*6, 0);
    gl.enableVertexAttribArray(positionID);

    normalID = gl.getAttribLocation(renderData.shaderProgram, 'a_Normal');
    gl.vertexAttribPointer(normalID, 3, gl.FLOAT, false, 4*6, 4*3);
    gl.enableVertexAttribArray(normalID);

    renderData.vertexBuffer = vertexBuffer;
}

function buildIndexBuffer(gl, renderData)
{
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(sphere_mesh.indices), gl.STATIC_DRAW);
    renderData.indexBuffer = indexBuffer;
}

function initializeUniformData(renderData)
{
    renderData.cameraPosition = vec3.create();
    renderData.cameraRotation = quat.create();

    renderData.normalMatrix = mat3.create();
    renderData.modelMatrix = mat4.create();
    renderData.viewMatrix = mat4.create();
    renderData.projectionMatrix = mat4.create();

    renderData.albedo = [0.0, 0.0, 0.0]
    renderData.metallic = 0.0;
    renderData.roughness = 0.0;

    vec3.add(renderData.cameraPosition, renderData.cameraPosition, [0.0, 0.0, 5.0]);
   
    mat4.perspective(renderData.projectionMatrix, Math.PI/4, 1, 0.01, 10.0 );
    //mat4.rotate(renderData.modelMatrix, renderData.modelMatrix, Math.PI/4, [1.0, 1.0, 0.0])
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
    gl.useProgram(renderData.shaderProgram);
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

function drawScene(gl, renderData)
{
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT || gl.DEPTH_BUFFER_BIT);
    
    gl.useProgram(renderData.shaderProgram);
    setShaderUniforms(gl, renderData);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderData.indexBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, renderData.vertexBuffer);
    gl.drawElements(gl.TRIANGLES, sphere_mesh.indices.length, gl.UNSIGNED_SHORT, 0);
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
    mymesh = new Model(gl);
    mymesh.mesh.loadMeshFromObject(sphere_mesh);
    console.log(mymesh);

    renderData = {};

    renderData.shaderProgram = compileShaderFromFiles(gl,
        "\\shaders\\projection.vs",
        "\\shaders\\projection.fs");

    renderData.diffuseProgram = compileShaderFromFiles(gl,
        "\\shaders\\diffuse_integration.vs",
        "\\shaders\\diffuse_integration.fs");

    buildVertexBuffer(gl, renderData);
    buildIndexBuffer(gl, renderData);
    initializeUniformData(renderData);
    initializeUI(renderData);

    renderData.environmentRadianceTexture = createNewTexture(gl);

    loadTextureFromImage(gl,
        renderData.environmentRadianceTexture,
        "\\images\\Circus_Backstage_8k.jpg",
        function(x, x){});

    framebuffer = createFramebuffer(gl, 200, 200);

    // Precompute
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.useProgram(renderData.diffuseProgram);
    gl.bindTexture(gl.TEXTURE_2D, renderData.environmentRadianceTexture);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderData.indexBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, renderData.vertexBuffer);
    gl.drawElements(gl.TRIANGLES, sphere_mesh.indices.length, gl.UNSIGNED_SHORT, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Animate
    lastTime = 0.0;
    function frameWork(currentTime)
    {
        var deltaTime = currentTime - lastTime;

        var angleChange = deltaTime * 0.001;
        vec3.rotateY(renderData.cameraPosition, renderData.cameraPosition, [0, 0, 0], angleChange);
        quat.rotateY(renderData.cameraRotation, renderData.cameraRotation, angleChange);

        updateUniformData(renderData);
        drawScene(gl, renderData);

        lastTime = currentTime;
        requestAnimationFrame(frameWork);
    }

    requestAnimationFrame(frameWork);

}

window.onload = main;