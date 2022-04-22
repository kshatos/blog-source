
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
        mat4.fromRotationTranslationScale(
            matrix,
            this.rotation, 
            this.position,
            this.scale);
        return matrix;
    }
}

function normalFromModelMatrix(modelMatrix)
{
    let normalMatrix3 = mat3.create();
    let normalMatrix4 = mat4.create();
    mat4.invert(normalMatrix4, modelMatrix);
    mat4.transpose(normalMatrix4, normalMatrix4);
    mat3.fromMat4(normalMatrix3, normalMatrix4);
    
    return normalMatrix3;
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

/***************************************
CAMERA
***************************************/
function PerspectiveCamera()
{
    this.transform = new Transform();
    this.fovy = Math.PI / 4;
    this.aspect = 1.0;
    this.near = 0.001;
    this.far = 50.0;

    this.viewMatrix = mat4.create();
    this.projectionMatrix = mat4.create();


    this.updateMatrices = function() {
        mat4.perspective(this.projectionMatrix, this.fovy, this.aspect, this.near, this.far);
        this.viewMatrix = this.transform.getMatrix();
        mat4.invert(this.viewMatrix, this.viewMatrix);
    }
}


/***************************************
SHADER
***************************************/
function loadTextFile(url, callback) {
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
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
