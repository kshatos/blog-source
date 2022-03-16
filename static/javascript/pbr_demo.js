/*
Data
*/
const positions = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,
  
    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,
  
    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,
  
    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,
  
    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,
  
    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0,
  ];

  const indices = [
    0,  1,  2,      0,  2,  3,    // front
    4,  5,  6,      4,  6,  7,    // back
    8,  9,  10,     8,  10, 11,   // top
    12, 13, 14,     12, 14, 15,   // bottom
    16, 17, 18,     16, 18, 19,   // right
    20, 21, 22,     20, 22, 23,   // left
  ];


/*
Utility Functions
*/
function createShader(gl, type, source)
{
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success)
    {
      return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
    // create a program.
    var program = gl.createProgram();
   
    // attach the shaders.
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
   
    // link the program.
    gl.linkProgram(program);
   
    // Check if it linked.
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!success) {
        // something went wrong with the link
        throw ("program failed to link:" + gl.getProgramInfoLog (program));
    }
   
    return program;
};

function loadTextFile(url, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, false);
    request.addEventListener('load', function() {
        callback(request.responseText);
    });
    request.send();
}

/*
Main Logic
*/
function loadShaderProgram(gl,renderData, vertexURL, fragmentURL)
{
    var vertexShader;
    var fragmentShader;
    loadTextFile(vertexURL, function(text) {
        vertexShader = createShader(gl, gl.VERTEX_SHADER, text);
    });
    loadTextFile(fragmentURL, function(text) {
        fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, text);
    });
    var shaderProgram = createProgram(gl, vertexShader, fragmentShader);
    renderData.shaderProgram = shaderProgram;
}

function buildVertexBuffer(gl, renderData)
{
    let vertexBuffer = gl.createBuffer(gl.ARRAY_BUFFER);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    positionID = gl.getAttribLocation(renderData.shaderProgram, 'a_Position');
    gl.vertexAttribPointer(positionID, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionID);

    normalID = gl.getAttribLocation(renderData.shaderProgram, 'a_Normal');
    gl.vertexAttribPointer(normalID, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalID);

    renderData.vertexBuffer = vertexBuffer;
}

function buildIndexBuffer(gl, renderData)
{
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices), gl.STATIC_DRAW);
    renderData.indexBuffer = indexBuffer;
}

function setShaderUniforms(gl, renderData)
{
    gl.useProgram(renderData.shaderProgram);
    normalMatLoc = gl.getUniformLocation(renderData.shaderProgram, "u_NormalMatrix");
    gl.uniformMatrix3fv(normalMatLoc, false,
        [
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 0.0, 1.0]);

    modelMatLoc = gl.getUniformLocation(renderData.shaderProgram, "u_ModelMatrix");
    gl.uniformMatrix4fv(modelMatLoc, false,
        [
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0]);
    
    viewMatLoc = gl.getUniformLocation(renderData.shaderProgram, "u_ViewMatrix");
    gl.uniformMatrix4fv(viewMatLoc, false,
        [
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0]);

    projMatLoc = gl.getUniformLocation(renderData.shaderProgram, "u_ProjectionMatrix");
    gl.uniformMatrix4fv(projMatLoc, false,
        [
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0]);
}


/*
Main
*/
function main()
{
    // Setup context
    const canvas = document.querySelector("#glCanvas");
    const gl = canvas.getContext("webgl");
  
    if (gl === null) {
      alert("Unable to initialize WebGL. Your browser or machine may not support it.");
      return;
    }

    // Build render data
    renderData = {
        shaderProgram: null,
        vertexBuffer: null,
        indexBuffer: null,
    };

    loadShaderProgram(gl, renderData, "\\shaders\\pbr_demo.vs", "\\shaders\\pbr_demo.fs");
    buildVertexBuffer(gl, renderData);
    buildIndexBuffer(gl, renderData)
    setShaderUniforms(gl, renderData)

    // Draw
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(renderData.shaderProgram);
    setShaderUniforms(gl, renderData)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderData.indexBuffer);
    gl.bindBuffer(gl.ARRAY_BUFFER, renderData.vertexBuffer);
    {
        const vertexCount = 36;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }













}

window.onload = main;