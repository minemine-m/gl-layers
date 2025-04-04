precision mediump float;

varying vec3 vWorldPos;

uniform samplerCube environmentMap;
uniform sampler2D distributionMap;
uniform float roughness;

const float PI = 3.14159265359;

// ----------------------------------------------------------------------------
// float DistributionGGX(vec3 N, vec3 H, float roughness)
// {
//     float a = roughness*roughness;
//     float a2 = a*a;
//     float NdotH = max(dot(N, H), 0.0);
//     float NdotH2 = NdotH*NdotH;

//     float nom   = a2;
//     float denom = (NdotH2 * (a2 - 1.0) + 1.0);
//     denom = PI * denom * denom;

//     return nom / denom;
// }

// ----------------------------------------------------------------------------
vec3 ImportanceSampleGGX(float Xi, vec3 N, float roughness)
{
    vec3 H = texture2D(distributionMap, vec2(roughness, Xi)).rgb;
    
    // from tangent-space H vector to world-space sample vector
    vec3 up          = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent   = normalize(cross(up, N));
    vec3 bitangent = cross(N, tangent);
    
    vec3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;
    return normalize(sampleVec);
}
// ----------------------------------------------------------------------------
void main()
{		
    vec3 N = normalize(vWorldPos);
    
    // make the simplyfying assumption that V equals R equals the normal 
    vec3 R = N;
    vec3 V = R;

    const int SAMPLE_COUNT = 1024;
    vec3 prefilteredColor = vec3(0.0);
    float totalWeight = 0.0;
    
    for(int i = 0; i < SAMPLE_COUNT; ++i)
    {
        // generates a sample vector that's biased towards the preferred alignment direction (importance sampling).
        vec3 H = ImportanceSampleGGX(float(i) / float(SAMPLE_COUNT), N, roughness);
        vec3 L  = normalize(2.0 * dot(V, H) * H - V);

        float NdotL = max(dot(N, L), 0.0);
        if(NdotL > 0.0)
        {
            // a more precision method,  sample from the environment's mip level based on roughness/pdf
            // float D   = DistributionGGX(N, H, roughness);
            // float NdotH = max(dot(N, H), 0.0);
            // float HdotV = max(dot(H, V), 0.0);
            // float pdf = D * NdotH / (4.0 * HdotV) + 0.0001; 

            // float resolution = 512.0; // resolution of source cubemap (per face)
            // float saTexel  = 4.0 * PI / (6.0 * resolution * resolution);
            // float saSample = 1.0 / (float(SAMPLE_COUNT) * pdf + 0.0001);

            // float mipLevel = roughness == 0.0 ? 0.0 : 0.5 * log2(saSample / saTexel); 
            
            // prefilteredColor += textureCube(environmentMap, L, mipLevel).rgb * NdotL;
            // totalWeight      += NdotL;
            //--------------------------------------------------------
            prefilteredColor += textureCube(environmentMap, L).rgb * NdotL;
            totalWeight      += NdotL;
        }
    }

    prefilteredColor = prefilteredColor / totalWeight;

    gl_FragColor = vec4(prefilteredColor, 1.0);
    // gl_FragColor = vec4(totalWeight, 0.0, 0.0, 1.0);
    // gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
