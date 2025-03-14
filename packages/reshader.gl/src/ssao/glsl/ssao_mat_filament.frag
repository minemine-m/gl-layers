//当前采用的filament的ssao.mat中的代码
//2019-11-19 “remove old 'SSAO' algorithm” commit 中的版本
#define NOISE_NONE      0
#define NOISE_PATTERN   1
#define NOISE_RANDOM    2
#define NOISE_TYPE      NOISE_PATTERN

const uint kSphereSampleCount = 16u;
const vec3 kSphereSamples[] = vec3[](
    vec3(-0.000002,  0.000000,  0.000002), vec3(-0.095089,  0.004589, -0.031253),
    vec3( 0.015180, -0.025586,  0.003765), vec3( 0.073426,  0.021802,  0.002778),
    vec3( 0.094587,  0.043218,  0.089148), vec3(-0.009509,  0.051369,  0.019673),
    vec3( 0.139973, -0.101685,  0.108570), vec3(-0.103804,  0.219853, -0.043016),
    vec3( 0.004841, -0.033988,  0.094187), vec3( 0.028011,  0.058466, -0.257110),
    vec3(-0.051031,  0.074993,  0.259843), vec3( 0.118822, -0.186537, -0.134192),
    vec3( 0.063949, -0.094894, -0.072683), vec3( 0.108176,  0.327108, -0.254058),
    vec3(-0.047180,  0.219180,  0.263895), vec3(-0.407709,  0.240834, -0.200352)
);

const uint kNoiseSampleCount = 16u;
const vec3 kNoiseSamples[] = vec3[](
    vec3(-0.078247, -0.749924, -0.656880), vec3(-0.572319, -0.102379, -0.813615),
    vec3( 0.048653, -0.380791,  0.923380), vec3( 0.281202, -0.656664, -0.699799),
    vec3( 0.711911, -0.235841, -0.661485), vec3(-0.445893,  0.611063,  0.654050),
    vec3(-0.703598,  0.674837,  0.222587), vec3( 0.768236,  0.507457,  0.390257),
    vec3(-0.670286, -0.470387,  0.573980), vec3( 0.199235,  0.849336, -0.488808),
    vec3(-0.768068, -0.583633, -0.263520), vec3(-0.897330,  0.328853,  0.294372),
    vec3(-0.570930, -0.531056, -0.626114), vec3( 0.699014,  0.063283, -0.712303),
    vec3( 0.207495,  0.976129, -0.064172), vec3(-0.060901, -0.869738, -0.489742)
);

// random number between 0 and 1
float random(highp vec2 n) {
    n  = fract(n * vec2(5.3987, 5.4421));
    n += dot(n.yx, n.xy + vec2(21.5351, 14.3137));
    highp float xy = n.x * n.y;
    // compute in [0..2[ and remap to [0.0..1.0[
    return fract(xy * 95.4307) + fract(xy * 75.04961) * 0.5;
}

// noise vector between -1 and 1
vec3 getNoise(const vec2 uv) {
    #if NOISE_TYPE == NOISE_RANDOM
        return normalize(2.0 * vec3(random(uv), random(uv * 2.0), random(uv * 4.0)) - vec3(1.0));
    #elif NOISE_TYPE == NOISE_PATTERN
        uint ix = uint(gl_FragCoord.x) & 3u;
        uint iy = uint(gl_FragCoord.y) & 3u;
        return kNoiseSamples[ix + iy * 4u];
    #else
        return vec3(0.0);
    #endif
}

highp float linearizeDepth(highp float depth) {
    highp mat4 projection = getClipFromViewMatrix();
    highp float z = depth * 2.0 - 1.0; // depth in clip space
    return -projection[3].z / (z + projection[2].z);
}

highp float sampleDepthLinear(const vec2 uv) {
    return linearizeDepth(texture(materialParams_depth, uv, 0.0).r);
}

highp vec3 computeViewSpacePositionFromDepth(in vec2 p, highp float linearDepth) {
    p = p * 2.0 - 1.0; // to clip space
    highp mat4 invProjection = getViewFromClipMatrix();
    p.x *= invProjection[0].x;
    p.y *= invProjection[1].y;
    return vec3(p * -linearDepth, linearDepth);
}

// compute normals using derivatives, which essentially results in half-resolution normals
// this creates arifacts around geometry edges
highp vec3 computeViewSpaceNormalNotNormalized(const highp vec3 position) {
    highp vec3 dpdx = dFdx(position);
    highp vec3 dpdy = dFdy(position);
    return cross(dpdx, dpdy);
}

// compute normals directly from the depth texture, resulting in full resolution normals
highp vec3 computeViewSpaceNormalNotNormalized(const highp vec3 position, const vec2 uv) {
    vec2 uvdx = uv + vec2(materialParams.resolution.z, 0.0);
    vec2 uvdy = uv + vec2(0.0, materialParams.resolution.w);
    highp vec3 px = computeViewSpacePositionFromDepth(uvdx, sampleDepthLinear(uvdx));
    highp vec3 py = computeViewSpacePositionFromDepth(uvdy, sampleDepthLinear(uvdy));
    highp vec3 dpdx = px - position;
    highp vec3 dpdy = py - position;
    return cross(dpdx, dpdy);
}

// Ambient Occlusion, largely inspired from:
// Hemisphere Crysis-style SSAO. See "Screen Space Ambient Occlusion" by John Chapman

float computeAmbientOcclusionSSAO(const highp vec3 origin, const vec3 normal, const vec3 noise, const vec3 sphereSample) {
    highp mat4 projection = getClipFromViewMatrix();
    float radius = materialParams.radius;
    float bias = materialParams.bias;

    vec3 r = sphereSample * radius;
    r = reflect(r, noise);
    r = sign(dot(r, normal)) * r;
    highp vec3 samplePos = origin + r;

    highp vec4 samplePosScreen = projection * vec4(samplePos, 1.0);
    samplePosScreen.xy = samplePosScreen.xy * (0.5 / samplePosScreen.w) + 0.5;

    highp float occlusionDepth = sampleDepthLinear(samplePosScreen.xy);

    // smoothstep() optimized for range 0 to 1
    float t = saturate(radius / abs(origin.z - occlusionDepth));
    float rangeCheck = t * t * (3.0 - 2.0 * t);
    float d = samplePos.z - occlusionDepth; // distance from depth to sample
    return (d >= -bias ? 0.0 : rangeCheck);
}

void material(inout MaterialInputs material) {
    prepareMaterial(material);

    vec2 uv = variable_vertex.xy; // interpolated to pixel center

    highp float depth = sampleDepthLinear(uv);
    highp vec3 origin = computeViewSpacePositionFromDepth(uv, depth);
    highp vec3 normal = computeViewSpaceNormalNotNormalized(origin, uv);

    normal = normalize(normal);
    vec3 noise = getNoise(uv);

    float occlusion = 0.0;
    for (uint i = 0u; i < kSphereSampleCount; i++) {
        occlusion += computeAmbientOcclusionSSAO(origin, normal, noise, kSphereSamples[i]);
    }

    float ao = 1.0 - occlusion / float(kSphereSampleCount);
    // simulate user-controled ao^n with n[1, 2]
    ao = mix(ao, ao * ao, materialParams.power);

    material.baseColor.r = ao;
}
