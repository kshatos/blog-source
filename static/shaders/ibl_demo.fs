#version 100
#extension GL_EXT_shader_texture_lod : enable
precision mediump float;

const float PI = 3.14159265359;

//////////////////////////////
// CAMERA DATA
//////////////////////////////
uniform vec3 u_viewPos;


//////////////////////////////
// PBR SURFACE MODEL
//////////////////////////////
struct PBRSurfaceData
{
    vec3 position;
    vec3 normal;
    vec3 albedo;
    float metallic;
    float roughness;
};

/* Trowbridge-Reitz GGX model */
float NormalDistribution_GGX(float cosNH, float roughness)
{
    float roughnessSquared = roughness * roughness;
    float denominator = cosNH * cosNH * (roughnessSquared - 1.0) + 1.0;
    return roughnessSquared / (PI * denominator * denominator);
}

/* Height Correlated Smith View */
float View_HCSmith(float cosNL, float cosNV, float roughness)
{
    float Vv = cosNL * (cosNV * (1.0 - roughness) + roughness);
    float Vl = cosNV * (cosNL * (1.0 - roughness) + roughness);

    return 0.5 / (Vv + Vl);
}

/* Schlick approximation */
vec3 Fresnel_Schlick(float cosVH, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(1.0 - cosVH, 5.0);
}

vec3 fresnelSchlickRoughness(float cosVH, vec3 F0, float roughness)
{
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosVH, 0.0, 1.0), 5.0);
}   

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


//////////////////////////////
// LIGHTING MODEL
//////////////////////////////
struct PointLight
{
    vec3 position;
    float radiantFlux;
    float range;
    vec3 color;
};

float PunctualLightAttenuation(float separation, float range)
{
    float separation2 = separation * separation;
    float relativeRange = min(1.0, separation / range);
    float relativeRange4 = relativeRange * relativeRange * relativeRange * relativeRange;

    return 1.0 / (separation2 + 1.0e-6) * (1.0 - relativeRange4);
}

vec3 PointLightReflectedRadiance(
    PointLight light,
    PBRSurfaceData surface)
{
    float separation = length(light.position - surface.position);
    vec3 viewDir = normalize(u_viewPos - surface.position);
    vec3 lightDir = normalize(light.position - surface.position);
    vec3 halfwayDir = normalize(lightDir + viewDir);

    vec3 f = BRDF(viewDir, lightDir, halfwayDir, surface);
    vec3 L0 = light.color * light.radiantFlux / (4.0 * PI);
    float A = PunctualLightAttenuation(separation, light.range);

    return L0 * A * f;
}


//////////////////////////////
// MAIN
//////////////////////////////
uniform vec3 u_albedo;
uniform float u_roughness;
uniform float u_metallic;

uniform sampler2D u_diffuseEnvironmentTex;
uniform sampler2D u_prefilterEnvironmentTex;
uniform sampler2D u_BRDFTex;

varying vec3 Pos;
varying vec3 Normal;
varying vec2 UV;


void main()
{
    // Camera object geometry
    vec3 normal = normalize(Normal);
    vec3 view = normalize(u_viewPos - Pos);
    vec3 reflected = reflect(-view, normal);

    vec2 longLatUV = vec2(0.0, 0.0);
    longLatUV.x = (normal.x == 0.0) ? 0.0 : atan(-normal.z, normal.x) / (2.0 * PI);
    longLatUV.x = longLatUV.x < 0.0 ? longLatUV.x + 1.0 : longLatUV.x;
    longLatUV.y = acos(-normal.y) / PI;
    longLatUV.y = longLatUV.y < 0.0 ? longLatUV.y + 1.0 : longLatUV.y;

    vec2 reflectedUV = vec2(0.0, 0.0);
    reflectedUV.x = (reflected.x == 0.0) ? 0.0 : atan(-reflected.z, reflected.x) / (2.0 * PI);
    reflectedUV.x = reflectedUV.x < 0.0 ? reflectedUV.x + 1.0 : reflectedUV.x;
    reflectedUV.y = acos(-reflected.y) / PI;
    reflectedUV.y = reflectedUV.y < 0.0 ? reflectedUV.y + 1.0 : reflectedUV.y;

    // Lighting calculations
    vec3 F0 = mix(vec3(0.04), u_albedo, u_metallic);
    float cosNV = clamp(dot(normal, view), 0.0, 1.0);

    vec3 F = fresnelSchlickRoughness(cosNV, F0, u_roughness);
    vec3 kS = F;
    vec3 kD = 1.0 - kS;
    kD *= 1.0 - u_metallic;
    
    vec3 irradiance = texture2D(u_diffuseEnvironmentTex, longLatUV).rgb;
    vec3 diffuse = irradiance * u_albedo;

    const float MAX_REFLECTION_LOD = 4.0;
    vec3 prefilteredColor = texture2DLodEXT(
        u_prefilterEnvironmentTex, reflectedUV,  5.0).rgb;
    vec2 brdf  = texture2D(u_BRDFTex, vec2(cosNV, u_roughness)).rg;
    vec3 specular = prefilteredColor * (F * brdf.x + brdf.y);
    vec3 result =  (kD * diffuse + specular);

    // HDR and gamma mapping
    result = result / (result + vec3(1.0));
    result = pow(result, vec3(1.0/2.2)); 

    gl_FragColor = vec4(result, 1.0);
}
