
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
function createNewTexture(gl)
{
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
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