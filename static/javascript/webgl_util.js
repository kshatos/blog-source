
const { mat2, mat2d, mat3, mat4, quat, quat2, vec2, vec3, vec4 } = glMatrix;


/***************************************
DATA
***************************************/
const emptyVertexSource = `
#version 100
void main() {}
`

const emptyFragmentSource = `
#version 100
precision mediump float;

void main()
{
    gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
}
`
/***************************************
Data Structures
***************************************/
function Transform()
{
    this.position = vec3.fromValues(0.0, 0.0, 0.0);
    this.rotation = quat.create();
    this.scale = vec3.fromValues(1.0, 1.0, 1.0);

    this.getMatrix = function() {
        let matrix = mat4.create();
        fromRotationTranslationScale(
            matrix,
            this.rotation, 
            this.position,
            this.scale);
        return matrix;
    }
}

/***************************************
MESH
***************************************/
function Mesh(gl)
{
    this.vertexBuffer = gl.createBuffer(gl.ARRAY_BUFFER);
    this.indexBuffer = gl.createBuffer(gl.ELEMENT_ARRAY_BUFFER);

    this.loadMeshFromObject = function(meshData) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshData.vertices), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshData.vertices), gl.STATIC_DRAW);

        positionID = 0;
        normalID = 1
        uvID = 2;

        gl.vertexAttribPointer(positionID, 3, gl.FLOAT, false, 4*8, 0);
        gl.enableVertexAttribArray(positionID);

        gl.vertexAttribPointer(normalID, 3, gl.FLOAT, false, 4*8, 4*3);
        gl.enableVertexAttribArray(normalID);

        gl.vertexAttribPointer(uvID, 2, gl.FLOAT, false, 4*8, 4*6);
        gl.enableVertexAttribArray(uvID);

        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(meshData.indices), gl.STATIC_DRAW);
    }
}

function Model(gl)
{
    this.mesh = new Mesh(gl);
    this.transform = new Transform();
}

// DEPRECIATED
function loadMeshFromObject(gl, meshData)
{
    meshBuffer = {
        vertexBuffer: null,
        indexBuffer: null
    }

    meshBuffer.vertexBuffer = gl.createBuffer(gl.ARRAY_BUFFER);
    gl.bindBuffer(gl.ARRAY_BUFFER, meshBuffer.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshData.vertices), gl.STATIC_DRAW);

    positionID = 0;
    normalID = 1
    uvID = 2;

    gl.vertexAttribPointer(positionID, 3, gl.FLOAT, false, 4*8, 0);
    gl.enableVertexAttribArray(positionID);

    gl.vertexAttribPointer(normalID, 3, gl.FLOAT, false, 4*8, 4*3);
    gl.enableVertexAttribArray(normalID);

    gl.vertexAttribPointer(uvID, 2, gl.FLOAT, false, 4*8, 4*6);
    gl.enableVertexAttribArray(uvID);

    meshBuffer.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, meshBuffer.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(meshData.indices), gl.STATIC_DRAW);

    return meshBuffer;
}

/***************************************
SHADER
***************************************/
function loadTextFile(url, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, false);
    request.addEventListener('load', function() {
        callback(request.responseText);
    });
    request.send();
}

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

function ShaderProgram(gl)
{
    this.program = null;

    this.compileFromSource = function(vertexSource, fragmentSource) {
        let vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
        let fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
        this.program = createProgram(gl, vertexShader, fragmentShader);
    }

    this.use = function() {
        if (this.program == null) { return; }
        gl.useProgram(this.program);
    }
}

// DEPRECIATED
function compileShaderFromSource(gl, vertexSource, fragmentSource)
{
    vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    var shaderProgram = createProgram(gl, vertexShader, fragmentShader);
    return shaderProgram;
}

function compileShaderFromFiles(gl, vertexURL, fragmentURL)
{
    let shaderProgram = gl.createProgram();
    var vertexShader;
    var fragmentShader;

    loadTextFile(vertexURL,
        function(text)
        {
            vertexShader = createShader(gl, gl.VERTEX_SHADER, text);
        }
    );
    loadTextFile(fragmentURL,
        function(text)
        {
            fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, text);
        }
    );

    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    
    return shaderProgram;
}


/***************************************
TEXTURES
***************************************/
function Texture2D(gl)
{
    this.texture = gl.createTexture(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    // Fill with one blue pixel so state is valid to use
    const width = 1;
    const height = 1;
    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);

    gl.texImage2D(
        gl.TEXTURE_2D,
        level, internalFormat,
        width, height, border, 
        srcFormat, srcType, pixel);

    gl.bindTexture(gl.TEXTURE_2D, null);


    this.loadFromImage = function(image) {
        const level = 0;
        const internalFormat = gl.RGBA;
        const srcFormat = gl.RGBA;
        const srcType = gl.UNSIGNED_BYTE;

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            level, internalFormat,
            srcFormat, srcType,
            image);

       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

       gl.bindTexture(gl.TEXTURE_2D, null);
    }

    this.use = function()
    {
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
    }

}

// DEPRECIATED
function createNewTexture(gl, width=1, height=1)
{
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);

    gl.texImage2D(
        gl.TEXTURE_2D,
        level, internalFormat,
        width, height, border, 
        srcFormat, srcType, pixel);

    return texture;
}

function loadTextureFromImage(gl, texture, url, onLoad)
{
    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;

    const image = new Image();
    image.onload = function()
    {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            level, internalFormat,
            srcFormat, srcType,
            image);

       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

       onLoad(image, texture);
    }
    image.src = url;
}

/***************************************
FRAMEBUFFER
***************************************/
function createFramebuffer(gl, width, height)
{
    let framebuffer = gl.createFramebuffer();

    colorTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);

    var fbStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (gl.FRAMEBUFFER_COMPLETE !== fbStatus) {
      console.log('Frame buffer object is incomplete: ' + fbStatus.toString());
      return error();
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return framebuffer;
}